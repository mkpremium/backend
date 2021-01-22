import { N1qlQuery } from 'couchbase'
import _ from 'lodash'
import moment from 'moment'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'

const listBuildingsByIdQuery = bucketName => `
SELECT
    building.id,
    building.metadata,
    building.address,
    building.floorArea,
    building.location,
    building.cadastre.reference cadastreReference,
    building.recentProposal.proposal lastProposal,
    building.\`use\`,
    building.ownerId,
    building.negotiationStatus,
    building.salePrice,

    stock[0] stock,

    ARRAY {m.eventDate, "ownerId": m.event.owner.id} FOR m IN buildingMeetings END buildingMeetings,
    ARRAY {o.id, o.featuredContact, "personId": o.person.id, o.person.firstName, "fullName": o.person.name, o.person.contacts} FOR o IN owners END owners
FROM ${bucketName} building
LEFT NEST ${bucketName} stock ON stock.buildingId = building.id AND stock._documentType = 'stock'

NEST ${bucketName} owners ON owners.status != "ERRONEO"
    AND owners.buildingId = building.id
    AND owners._documentType = 'owner'


LEFT NEST ${bucketName} buildingMeetings ON buildingMeetings.event.buildingId = building.id
    AND buildingMeetings._documentType = 'scheduled-event' AND buildingMeetings.type = 'MEETINGS'
WHERE building._documentType = 'building'
AND building.id IN $1
`

const listProposalsForBuildingIdQuery = bucketName => `
SELECT
id,
proposal,
createdAt,
updatedAt,
aspiration
FROM ${bucketName}
WHERE _documentType = 'building-proposal'
AND buildingId = $1
`

const assignedBuildingsIdForAgentQuery = bucketName => `
SELECT
    id buildingId
FROM ${bucketName}
WHERE _documentType = 'building'
    AND assignedAgentId = $1
`

export class CommercialsBuildingRepository {
  /**
   * @param {CouchbaseAdapter} couchbaseAdapter
   */
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  listById (ids) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listBuildingsByIdQuery(this.couchbaseAdapter.bucketName)).consistency(N1qlQuery.Consistency.STATEMENT_PLUS),
      [ ids ]
    ).then(CommercialsBuildingRepository.mapToPropertyAgentBuildingView)
  }

  listAssignedToPropertyAgentOfId (agentId) {
    return this.allAssignedBuildingsId(agentId)
      .then(buildingsId => this.listById(buildingsId))
  }

  listProposalsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listProposalsForBuildingIdQuery(this.couchbaseAdapter.bucketName)), [ buildingId ]
    )
  }

  allAssignedBuildingsId (agentId) {
    return this.couchbaseAdapter
      .queryAsync(N1qlQuery.fromString(assignedBuildingsIdForAgentQuery(this.couchbaseAdapter.bucketName)), [ agentId ])
      .then(result => result.map(({ buildingId }) => buildingId))
  }

  static mapToPropertyAgentBuildingView (buildings) {
    return buildings.map(
      ({
        id, metadata, stock, lastProposal, cadastreReference, address, location, use, floorArea,
        ownerId, buildingMeetings = [], owners, negotiationStatus, salePrice
      }) => {
        buildingMeetings.sort((a, b) => moment(a.eventDate).unix() - moment(b.eventDate).unix())

        const lastMeeting = buildingMeetings.length > 0 ? buildingMeetings[ buildingMeetings.length - 1 ] : undefined
        const featuredOwner = CommercialsBuildingRepository.getOwner(ownerId, lastMeeting, owners)
        const contacts = featuredOwner ? featuredOwner.contacts : undefined

        return ({
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
          latestProposal: lastProposal ? {
            amount: lastProposal
          } : undefined,
          address: address ? {
            neighborhood: address.neighborhood ? address.neighborhood : undefined,
            type: address.type ? address.type : undefined,
            street: address.street ? address.street : undefined,
            number: address.number ? address.number : undefined,
            postalCode: address.postalCode && address.postalCode.number ? {
              number: address.postalCode.number
            } : undefined,
            city: address.city ? address.city : undefined
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
            dateMeeting: moment(lastMeeting.eventDate).format()
          }) || undefined,
          salePrice: salePrice || undefined
        })
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
      CommercialsBuildingRepository.ownerOfId(validatedOwners, lastMeetingOwnerId) || validatedOwners[ 0 ]
  }

  static ownerOfId (validatedOwners, ownerId) {
    return validatedOwners.find(o => o.id === ownerId)
  }
}

export const mapToBuildingV2 = buildings => buildings.map(
  b => {
    const { buildingMeetings, ownerId, owners, floorArea } = b
    buildingMeetings.sort((a, b) => moment(a.eventDate).unix() - moment(b.eventDate).unix())

    const lastMeeting = buildingMeetings.length > 0 ? buildingMeetings[ buildingMeetings.length - 1 ] : undefined
    const owner = CommercialsBuildingRepository.getOwner(ownerId, lastMeeting, owners)

    const v2Building = {
      ...b,
      floorArea: floorArea ? parseInt(floorArea) : undefined,
      owner
    }
    try {
      return fromJSON(v2Building, BuildingV2)
    } catch (error) {
      error.message = `[building:${b.id}] ${error.message}`
      throw error
    }
  }
)

const DateTimeString = t.irreducible('DateTimeString', dts => moment.utc(dts).isValid())

const BuildingV2 = t.struct({
  id: t.String,
  files: t.list(t.struct({
    id: t.String,
    mimeType: t.String,
    thumbnailUrl: t.String
  })),
  stock: t.maybe(t.struct({
    purchase: t.maybe(t.struct({
      reservationAmount: t.Number,
      reservationDate: DateTimeString,
      transactionAmount: t.Number,
      transactionDate: t.maybe(DateTimeString)
    })),
    sell: t.maybe(t.struct({
      reservationAmount: t.Number,
      reservationDate: t.maybe(DateTimeString),
      transactionAmount: t.Number,
      transactionDate: t.maybe(DateTimeString)
    })),
    close: t.maybe(t.struct({
      operatorId: t.String,
      gain: t.Number,
      transactionDate: DateTimeString
    }))
  })),
  latestProposal: t.maybe(t.struct({
    amount: t.Number
  })),
  address: t.maybe(t.struct({
    neighborhood: t.maybe(t.String),
    type: t.maybe(t.String),
    street: t.maybe(t.String),
    number: t.maybe(t.union([ t.String, t.Number ])),
    postalCode: t.maybe(t.struct({
      number: t.String
    })),
    city: t.maybe(t.String)
  })),
  geolocation: t.maybe(t.struct({
    latitude: t.maybe(t.Number),
    longitude: t.maybe(t.Number)
  })),
  cadastreReference: t.maybe(t.String),
  negotiationStatus: t.maybe(t.String),
  floorArea: t.maybe(t.Number),
  usage: t.maybe(t.String),
  owner: t.maybe(t.struct({
    id: t.String,
    firstName: t.maybe(t.String),
    fullName: t.String,
    contacts: t.maybe(t.list(t.struct({
      id: t.String,
      status: t.enums.of([ 'GOOD', 'BAD', 'UNDEFINED' ]),
      type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ])
    }))),
    featuredContact: t.maybe(t.struct({
      phoneId: t.maybe(t.String),
      emailId: t.maybe(t.String)
    }))
  })),
  lastMeeting: t.maybe(t.struct({
    dateMeeting: DateTimeString
  })),
  salePrice: t.maybe(t.Number)
})
