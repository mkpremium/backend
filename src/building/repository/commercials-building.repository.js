import { N1qlQuery } from 'couchbase'
import _ from 'lodash'
import moment from 'moment'

const listBuildingsByIdQuery = bucketName => `
SELECT
    building.id,
    building.metadata,
    building.address,
    building.floorArea,
    building.location,
    building.cadastre.reference cadastreReference,
    {"amount": building.recentProposal.proposal, "createdAt": building.recentProposal.createdAt} 
    ,
    building.\`use\`,
    building.ownerId,
    building.negotiationStatus,
    building.salePrice,
    building.totalExpensesAmount,

    stock[0] stock,

    ARRAY {m.eventDate, "ownerId": m.event.owner.id, "inPerson": m.event.inPerson} FOR m IN buildingMeetings END buildingMeetings,
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
        id, metadata, stock, latestProposal, cadastreReference, address, location, use, floorArea,
        ownerId, buildingMeetings = [], owners, negotiationStatus, salePrice, totalExpensesAmount
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
          latestProposal: latestProposal.amount ? latestProposal : undefined,
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
          totalExpensesAmount: totalExpensesAmount || undefined
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
