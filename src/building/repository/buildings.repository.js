import { N1qlQuery } from 'couchbase'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import t from 'tcomb'
import moment from 'moment'

const setBuildingFeaturedOwner = bucketName => `
UPDATE ${bucketName} building
SET building.ownerId = $2
WHERE building._documentType = 'building' AND building.id = $1
`

const setBuildingNegotiationStatusQuery = bucketName => `
UPDATE ${bucketName}
SET negotiationStatus = $2
WHERE _documentType = 'building' AND id = $1
`

const assignBuildingToAgentQuery = bucketName => `
UPDATE ${bucketName} building
SET building.assignedAgentId = $2
WHERE building._documentType = 'building' AND building.id = $1
`

const pullBuildingOutOfFreezerQuery = bucketName => `
UPDATE ${bucketName} building
UNSET building.assignedAgentId, building.negotiationStatus
WHERE building._documentType = 'building' AND building.id IN $1
`

export class BuildingsRepository extends CouchbaseRepository {
  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingFeaturedOwner(this.bucketName)),
      [ buildingId, ownerId ]
    )
  }

  async setBuildingNegotiationStatus (buildingId, negotiationStatus) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingNegotiationStatusQuery(this.bucketName)),
      [ buildingId, negotiationStatus ]
    )
  }

  async assignBuildingToAgent (buildingId, agentId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(assignBuildingToAgentQuery(this.bucketName)), [ buildingId, agentId ]
    )
  }

  async pullBuildingsOutOfFreezer (buildingIds) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(pullBuildingOutOfFreezerQuery(this.bucketName)), [ buildingIds ]
    )
  }

  struct () {
    return BuildingV2
  }
}

const DateTimeString = t.irreducible('DateTimeString', dts => moment.utc(dts).isValid())
export const BuildingV2 = t.struct({
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
