import { N1qlQuery } from 'couchbase'
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

    stock,

    ARRAY {m.eventDate, "ownerId": m.event.owner.id} FOR m IN buildingMeetings END buildingMeetings,
    ARRAY {"negotiationStatus": o.business.status, o.id, o.featuredContact} FOR o IN verifiedOwners END verifiedOwners,
    ARRAY {p.id, p.firstName, "fullName": p.name, p.contacts} FOR p IN personOwners END personOwners
FROM mkpremium building
LEFT NEST mkpremium stock ON stock.buildingId = building.id AND stock._documentType = 'stock'

LEFT NEST mkpremium verifiedOwners ON verifiedOwners.status = "VERIFICADO"
    AND verifiedOwners.buildingId = building.id
    AND verifiedOwners._documentType = 'owner'
LEFT NEST mkpremium personOwners ON personOwners.id IN ARRAY o.personId FOR o IN verifiedOwners END
    AND personOwners._documentType = 'person'

LEFT NEST mkpremium buildingMeetings ON buildingMeetings.event.buildingId = building.id
    AND buildingMeetings._documentType = 'scheduled-event' AND buildingMeetings.type = 'MEETINGS'
WHERE building._documentType = 'building'
AND building.id IN $1
`

const listBuildingsByAssignedPropertyAgentQuery = `
SELECT
    building.id,
    MIN(building.metadata) metadata,
    MIN(stock) stock,
    MIN(building.address) address,
    MIN(building.cadastre.reference) cadastreReference,
    MIN(building.floorArea) floorArea,
    MIN(building.location) location,
    MIN(building.recentProposal.proposal) lastProposal,
    MIN(building.\`use\`) \`use\`,
    MIN(owner.business.status) negotiationStatus,
    MIN(owner.id) ownerId,
    MIN(person.firstName) ownerFirstName,
    MIN(person.name) ownerFullName,
    MIN(person.contacts) contacts,
    MIN(owner.featuredContact) featuredContact,
    MAX(buildingMeetings.eventDate) lastMeetingAt
FROM mkpremium building
LEFT JOIN mkpremium stock ON stock.buildingId = building.id AND stock._documentType = 'stock'
INNER JOIN mkpremium owner ON building.ownerId = owner.id AND owner._documentType = 'owner'
    AND owner.business.meetingWithOperatorId = $1
LEFT JOIN mkpremium person ON person.id = owner.personId AND person._documentType = 'person'
LEFT JOIN mkpremium buildingMeetings ON buildingMeetings.event.buildingId = building.id
    AND buildingMeetings._documentType = 'scheduled-event' AND buildingMeetings.type = 'MEETINGS'
WHERE building._documentType = 'building' AND building.ownerId IS NOT NULL
GROUP BY building.id
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

export class CommercialsBuildingRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  listById (ids) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listBuildingsByIdQuery), [ ids ]
    ).then(this.mapToPropertyAgentBuildingView2())
  }

  listAssignedToPropertyAgentOfId (agentId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listBuildingsByAssignedPropertyAgentQuery), [ agentId ]
    ).then(this.mapToPropertyAgentBuildingView())
  }

  listProposalsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listProposalsForBuildingIdQuery), [ buildingId ]
    )
  }

  mapToPropertyAgentBuildingView () {
    return buildings => buildings.map(
      ({
        id, metadata, stock, lastProposal, cadastreReference, negotiationStatus, address, location, use, floorArea,
        ownerId, ownerFirstName, ownerFullName, contacts, lastMeetingAt, featuredContact
      }) => {
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
          owner: (ownerId && {
            id: ownerId,
            firstName: ownerFirstName,
            name: ownerFullName,
            contacts: (contacts && contacts.map(({ id, status, type, value }) => ({ id, status, type, value })))
          }) || undefined,
          lastMeeting: (lastMeetingAt && {
            dateMeeting: moment(lastMeetingAt).format()
          }) || undefined,
          featuredContact: featuredContact || undefined
        })
      }
    )
  }

  mapToPropertyAgentBuildingView2 () {
    return buildings => buildings.map(
      ({
        id, metadata, stock, lastProposal, cadastreReference, address, location, use, floorArea,
        ownerId, buildingMeetings = [], verifiedOwners, personOwners
      }) => {
        buildingMeetings.sort((a, b) => moment(a.eventDate).unix() - moment(b.eventDate).unix())
        const lastMeeting = buildingMeetings.length > 0 ? buildingMeetings[buildingMeetings.length - 1] : undefined
        const featuredOwnerId = ownerId || (lastMeeting ? lastMeeting.ownerId : undefined)
        const featuredOwner = featuredOwnerId ? verifiedOwners.find(o => o.id === featuredOwnerId) : undefined
        const featuredOwnerPerson = featuredOwner ? personOwners.find(p => p.id === featuredOwner.personId) : undefined
        const contacts = featuredOwnerPerson && featuredOwnerPerson.contacts

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
          negotiationStatus: featuredOwner ? featuredOwner.negotiationStatus : undefined,
          floorArea,
          usage: use !== null ? use : undefined,
          owner: (featuredOwnerId && {
            id: featuredOwnerId,
            firstName: featuredOwnerPerson && featuredOwnerPerson.name,
            name: featuredOwnerPerson && featuredOwnerPerson.fullName,
            contacts: (contacts && contacts.map(({ id, status, type, value }) => ({ id, status, type, value })))
          }) || undefined,
          lastMeeting: (lastMeeting && {
            dateMeeting: moment(lastMeeting.eventDate).format()
          }) || undefined,
          featuredContact: featuredOwner && featuredOwner.featuredContact ? featuredOwner.featuredContact : undefined
        })
      }
    )
  }
}
