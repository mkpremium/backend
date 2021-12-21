import _ from 'lodash'
import moment from 'moment'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { BuildingAddressProps, BuildingNegotiationStatus, BuildingProps } from '../building'
import { ContactProps } from '../../owner/owner'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'

const listBuildingsByQuery = (bucketName, condition) => `
SELECT
    building.id,
    building.metadata,
    building.address,
    building.floorArea,
    building.location,
    building.cadastre.reference cadastreReference,
    {
      "amount": proposal.proposal,
      proposal.createdAt,
      proposal.notificationStatus,
      proposal.notificationSentAt
    } latestProposal,
    building.\`use\`,
    building.ownerId,
    building.negotiationStatus,
    building.salePrice,
    building.totalExpensesAmount,
    building.lead,

    stock[0] stock,

    ARRAY {m.eventDate, "ownerId": m.event.owner.id, "inPerson": m.event.inPerson} FOR m IN buildingMeetings END buildingMeetings,
    ARRAY {o.id, o.featuredContact, "personId": o.person.id, o.person.firstName, "fullName": o.person.name, o.person.contacts} FOR o IN owners END owners
FROM ${bucketName} building
LEFT NEST ${bucketName} stock ON stock.buildingId = META(building).id AND stock._documentType = 'stock'

NEST ${bucketName} owners ON owners.status NOT IN ["ERRONEO", "WITHOUT_CONTACT"]
    AND owners.buildingId = META(building).id
    AND owners._documentType = 'owner'

LEFT JOIN ${bucketName} proposal ON proposal._documentType = 'building-proposal'
    AND META(proposal).id = building.recentProposal.id

LEFT NEST ${bucketName} buildingMeetings ON buildingMeetings.event.buildingId = META(building).id
    AND buildingMeetings._documentType = 'scheduled-event' AND buildingMeetings.type = 'MEETINGS'
WHERE building._documentType = 'building'
AND ${condition}
`
const listBuildingsByIdQuery = bucketName => listBuildingsByQuery(bucketName, 'META(building).id IN $1')

const listProposalsForBuildingIdQuery = bucketName => `
    SELECT id,
           proposal,
           createdAt,
           updatedAt,
           aspiration
    FROM ${bucketName}
    WHERE _documentType = 'building-proposal'
      AND buildingId = $1
`

const assignedBuildingsIdForFlipperQuery = bucketName => `
    SELECT id buildingId
    FROM ${bucketName}
    WHERE _documentType = 'building'
      AND negotiationStatus NOT IN ['NO VENDE', 'DESCARTADO']
      AND assignedAgentId = $1
`

interface StockTransaction {
  reservationAmount: number
  reservationDate: Date | string
  transactionAmount: number
  transactionDate: Date | string
}

export interface BuildingReadModel extends Omit<BuildingProps, 'address' | 'metadata'> {
  readonly address: Omit<BuildingAddressProps, 'fullAddress' | 'postalCode'> & {
    postalCode: {
      number: number | string
    }
  }
  readonly cadastreReference?: string
  readonly geolocation?: {
    latitude?: number
    longitude?: number
  }
  readonly metadata: {
    id: string
    mimeType: string
    thumbnailUrl: string
  }[]
  readonly stock: {
    purchase: StockTransaction
    sell: StockTransaction
    close: {
      transactionDate: Date | string
      gain: number
    }
  }
  readonly owner?: {
    id: string
    firstName: string
    name: string
    contacts: ContactProps[],
    featuredContact?: {
      phoneId?: string;
      emailId?: string;
    }
  }
  readonly latestProposal?: {
    amount: number
    createdAt: Date | string
    notificationStatus?: 'PENDING' | 'SENT'
    notificationSentAt?: Date | string
  }
  readonly usage?: string
  readonly lastMeeting?: {
    dateMeeting: Date | string
    inPerson: boolean
  }
  readonly salePrice?: number
  readonly totalExpensesAmount?: number
}

export class BuildingsReadRepository {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter
  ) {
  }

  listById (ids): Promise<BuildingReadModel[]> {
    return this.couchbaseAdapter.queryAsync(
      listBuildingsByIdQuery(this.couchbaseAdapter.bucketName),
      [ ids ]
    ).then(BuildingsReadRepository.mapToPropertyAgentBuildingView)
  }

  listAssignedToPropertyAgentOfId (agentId): Promise<BuildingReadModel[]> {
    return this.allAssignedBuildingsId(agentId)
      .then(buildingsId => this.listById(buildingsId))
  }

  listProposalsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      listProposalsForBuildingIdQuery(this.couchbaseAdapter.bucketName),
      [ buildingId ]
    )
  }

  assignedToFlipperAndWithStatus (flipperId: string, status: BuildingNegotiationStatus): TE.TaskEither<Error, BuildingReadModel[]> {
    const query = `
        SELECT id
        FROM ${this.couchbaseAdapter.bucketName}
        WHERE _documentType = 'building'
          AND assignedAgentId = $1
          AND negotiationStatus = $2
    `
    return pipe(
      fromPromise(this.couchbaseAdapter.queryAsync(query, [ flipperId, status ])),
      TE.chain(ids => fromPromise(this.listById(ids.map(({ id }) => id))))
    )
  }

  ofCadastreReference (cadastreReference: string): TE.TaskEither<Error, BuildingReadModel | undefined> {
    return pipe(
      fromPromise(this.couchbaseAdapter.queryAsync(
          listBuildingsByQuery(this.couchbaseAdapter.bucketName, 'building.cadastre.reference = $1'),
          [ cadastreReference ]
        )
      ),
      TE.chain(rows => {
        if (rows.length === 0) {
          return TE.of(undefined)
        }

        return TE.of(BuildingsReadRepository.mapToPropertyAgentBuildingView(rows)[ 0 ])
      })
    )
  }

  private allAssignedBuildingsId (flipperId): Promise<string[]> {
    return this.couchbaseAdapter
      .queryAsync(assignedBuildingsIdForFlipperQuery(this.couchbaseAdapter.bucketName), [ flipperId ])
      .then(result => result.map(({ buildingId }) => buildingId))
  }

  static mapToPropertyAgentBuildingView (buildings): BuildingReadModel[] {
    return buildings.map(
      ({
         id, metadata, stock, latestProposal, cadastreReference, address, location, use, floorArea,
         ownerId, buildingMeetings = [], owners, negotiationStatus, salePrice, totalExpensesAmount,
         lead
       }) => {
        buildingMeetings.sort((a, b) => moment(a.eventDate).unix() - moment(b.eventDate).unix())

        const lastMeeting = buildingMeetings.length > 0 ? buildingMeetings[ buildingMeetings.length - 1 ] : undefined
        const featuredOwner = BuildingsReadRepository.getOwner(ownerId, lastMeeting, owners)
        const contacts = featuredOwner ? featuredOwner.contacts : undefined

        return {
          id,
          metadata: metadata.map(({ id, mimeType, previewUrl }) => ({
            id,
            mimeType,
            thumbnailUrl: previewUrl
          })),
          stock: {
            purchase: stock && stock.purchase ? {
              reservationAmount: stock.purchase.reservationAmount,
              reservationDate: stock.purchase.reservationDate ? moment(stock.purchase.reservationDate).format() : undefined,
              transactionAmount: stock.purchase.transactionAmount,
              transactionDate: moment(stock.purchase.transactionDate).format()
            } : undefined,
            sell: stock && stock.sell ? {
              reservationAmount: stock.sell.reservationAmount,
              reservationDate: stock.sell.reservationDate ? moment(stock.sell.reservationDate).format() : undefined,
              transactionAmount: stock.sell.transactionAmount,
              transactionDate: moment(stock.sell.transactionDate).format()
            } : undefined,
            close: stock && stock.close ? {
              gain: stock.close.gain,
              transactionDate: moment(stock.close.transactionDate).format()
            } : undefined
          },
          latestProposal: latestProposal && latestProposal.amount ? latestProposal : undefined,
          address: address ? {
            neighborhood: address.neighborhood ? address.neighborhood : undefined,
            type: address.type ? address.type : undefined,
            street: address.street ? address.street : undefined,
            number: address.number ? address.number : undefined,
            postalCode: address.postalCode && address.postalCode.number ? {
              number: address.postalCode.number
            } : undefined,
            city: address.city ? address.city : undefined,
            province: address.province ? address.province : undefined
          } : undefined,
          geolocation: location && (location.lat || location.lng) ? {
            latitude: location.lat ? location.lat : undefined,
            longitude: location.lng ? location.lng : undefined
          } : undefined,
          cadastreReference: cadastreReference || undefined,
          negotiationStatus: negotiationStatus || undefined,
          floorArea,
          usage: use !== null ? use : undefined,
          owner: (featuredOwner && {
            id: featuredOwner.id,
            firstName: _.get(featuredOwner, 'firstName'),
            name: _.get(featuredOwner, 'fullName'),
            contacts: (contacts && contacts.map(({ id, status, type, value }) => ({ id, status, type, value }))),
            featuredContact: (featuredOwner && featuredOwner.featuredContact) || undefined
          }) || undefined,
          lastMeeting: (lastMeeting && {
            dateMeeting: moment(lastMeeting.eventDate).format(),
            inPerson: lastMeeting.inPerson
          }) || undefined,
          salePrice: salePrice || undefined,
          totalExpensesAmount: totalExpensesAmount || undefined,
          lead,
        } as BuildingReadModel
      }
    )
  }

  static getOwner (featuredOwnerId, lastMeeting, owners) {
    const validatedOwners = (owners || []).filter(({ contacts }) => (contacts || []).find(({ status }) => status === 'GOOD'))
    if (!validatedOwners || validatedOwners.length === 0) {
      return
    }
    const lastMeetingOwnerId = _.get(lastMeeting, 'ownerId')

    return this.ownerOfId(validatedOwners, featuredOwnerId) ||
      BuildingsReadRepository.ownerOfId(validatedOwners, lastMeetingOwnerId) || validatedOwners[ 0 ]
  }

  static ownerOfId (validatedOwners, ownerId) {
    return validatedOwners.find(o => o.id === ownerId)
  }
}
