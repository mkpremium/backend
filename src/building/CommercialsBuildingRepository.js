import { N1qlQuery } from 'couchbase'
import _ from 'lodash'
import moment from 'moment'

const listBuildingsByIdQuery = `
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

    stock[0] stock,

    ARRAY {m.eventDate, "ownerId": m.event.owner.id} FOR m IN buildingMeetings END buildingMeetings,
    ARRAY {o.id, o.featuredContact, o.personId} FOR o IN verifiedOwners END verifiedOwners,
    ARRAY {p.id, p.firstName, "fullName": p.name, p.contacts} FOR p IN personOwners END personOwners
FROM mkpremium building
LEFT NEST mkpremium stock ON stock.buildingId = building.id AND stock._documentType = 'stock'

LEFT NEST mkpremium verifiedOwners ON verifiedOwners.status = "VERIFICADO"
    AND verifiedOwners.buildingId = building.id
    AND verifiedOwners._documentType = 'owner'
LEFT NEST mkpremium personOwners ON personOwners.id IN ARRAY o.personId FOR o IN verifiedOwners END
    AND personOwners._documentType = 'person'
    AND personOwners.active = true
    AND ANY c in personOwners.contacts SATISFIES c.status = "GOOD" END

LEFT NEST mkpremium buildingMeetings ON buildingMeetings.event.buildingId = building.id
    AND buildingMeetings._documentType = 'scheduled-event' AND buildingMeetings.type = 'MEETINGS'
WHERE building._documentType = 'building'
AND building.id IN $1
`

const listProposalsForBuildingIdQuery = `
SELECT
id,
proposal,
createdAt,
updatedAt,
aspiration
FROM mkpremium
WHERE _documentType = 'building-proposal'
AND buildingId = $1
`

const assignedBuildingsIdForAgentQuery = `
SELECT
    building.id buildingId
FROM mkpremium building
WHERE building._documentType = 'building'
    AND building.assignedAgentId = $1
`

export class CommercialsBuildingRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  listById (ids) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listBuildingsByIdQuery), [ ids ]
    ).then(CommercialsBuildingRepository.mapToPropertyAgentBuildingView)
  }

  listAssignedToPropertyAgentOfId (agentId) {
    return this.allAssignedBuildingsId(agentId)
      .then(buildingsId => this.listById(buildingsId))
  }

  listProposalsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listProposalsForBuildingIdQuery), [ buildingId ]
    )
  }

  allAssignedBuildingsId (agentId) {
    return this.couchbaseAdapter
      .queryAsync(N1qlQuery.fromString(assignedBuildingsIdForAgentQuery), [ agentId ])
      .then(result => result.map(({ buildingId }) => buildingId))
  }

  static mapToPropertyAgentBuildingView (buildings) {
    return buildings.map(
      ({
        id, metadata, stock, lastProposal, cadastreReference, address, location, use, floorArea,
        ownerId, buildingMeetings = [], verifiedOwners, personOwners, negotiationStatus
      }) => {
        buildingMeetings.sort((a, b) => moment(a.eventDate).unix() - moment(b.eventDate).unix())
        const ownersWithPerson = verifiedOwners.map(vo => ({...vo, person: personOwners.find(p => p.id === vo.personId)}))
          .filter(vo => !!vo.person)

        const lastMeeting = buildingMeetings.length > 0 ? buildingMeetings[ buildingMeetings.length - 1 ] : undefined
        const featuredOwnerId = ownerId ||
                                _.get(lastMeeting, 'ownerId') ||
                                _.get(verifiedOwners, '[0].id')
        const featuredOwner = featuredOwnerId ? ownersWithPerson.find(o => o.id === featuredOwnerId) : undefined
        const contacts = _.get(featuredOwner, 'person.contacts')

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
          owner: (featuredOwnerId && {
            id: featuredOwnerId,
            firstName: _.get(featuredOwner, 'person.firstName'),
            name: _.get(featuredOwner, 'person.fullName'),
            contacts: (contacts && contacts.map(({ id, status, type, value }) => ({ id, status, type, value }))),
            featuredContact: featuredOwner && featuredOwner.featuredContact ? featuredOwner.featuredContact : undefined
          }) || undefined,
          lastMeeting: (lastMeeting && {
            dateMeeting: moment(lastMeeting.eventDate).format()
          }) || undefined
        })
      }
    )
  }
}
