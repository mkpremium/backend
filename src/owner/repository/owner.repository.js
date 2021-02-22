import { Owner } from '../owner'
import t from 'tcomb'
import { N1qlQuery } from 'couchbase'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'

const findOwnerByContactValueQuery = bucketName => `
SELECT
owner.id,
owner.buildingId,
owner.person.contacts,
building.address buildingAddress,
worksheet.id worksheetId,
owner.name
FROM ${bucketName} owner
JOIN ${bucketName} building ON building._documentType = 'building' AND building.id = owner.buildingId
JOIN ${bucketName} worksheet ON worksheet._documentType = 'worksheet' AND worksheet.relatedBuildingIds[0] = building.id
WHERE owner._documentType = 'owner'
AND ANY c IN owner.person.contacts SATISFIES c.\`value\` = $1 END
`

const buildingOwnersQuery = bucketName => `
SELECT
id,
name,
person.contacts,
featuredContact
FROM ${bucketName} owner
WHERE _documentType = 'owner' and buildingId = $1
`

const FoundOwner = t.struct({
  id: t.String,
  buildingId: t.String,
  worksheetId: t.String,
  matchingContactId: t.String,
  name: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    value: t.String,
    type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ]),
    status: t.enums.of([ 'UNDEFINED', 'GOOD', 'BAD' ])
  })),
  buildingAddress: t.struct({
    neighborhood: t.maybe(t.String),
    type: t.maybe(t.String),
    street: t.maybe(t.String),
    number: t.maybe(t.union([ t.String, t.Number ])),
    postalCode: t.maybe(t.struct({
      number: t.maybe(t.union([ t.String, t.Number ]))
    })),
    city: t.maybe(t.String)
  })
})

const BuildingOwner = t.struct({
  id: t.String,
  name: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    status: t.enums.of(['GOOD', 'BAD', 'UNDEFINED']),
    type: t.enums.of(['TELEFONO', 'MOVIL', 'EMAIL']),
    value: t.String
  })),
  featuredContact: t.maybe(t.struct({
    phoneId: t.maybe(t.String),
    emailId: t.maybe(t.String)
  }))
})

export class OwnerRepository extends CouchbaseRepository {
  async findByPhoneNumber (phoneNumber) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(findOwnerByContactValueQuery(this.bucketName)),
      [ phoneNumber ]
    ).then(result => fromJSON(result.map(rec => {
      const matchingContactIdx = rec.contacts.findIndex(c => c.value === phoneNumber)
      return { ...rec, matchingContactId: rec.contacts[ matchingContactIdx ].id }
    }), t.list(FoundOwner)))
  }

  async buildingOwners (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(buildingOwnersQuery(this.bucketName)),
      [ buildingId ]
    ).then(rawOwners => rawOwners.map(o => {
      try {
        return fromJSON(o, BuildingOwner)
      } catch (error) {
        logger.error('parsing building owner', {
          buildingId,
          ownerId: o.id,
          errorMessage: error.message,
          stack: error.stack
        })
        return o
      }
    }))
  }

  struct () {
    return Owner
  }
}
