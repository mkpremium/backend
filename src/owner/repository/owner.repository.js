import { Owner } from '../owner'
import t from 'tcomb'
import { N1qlQuery } from 'couchbase'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'

const findOwnerByContactValueQuery = bucketName => `
SELECT
owner.id,
owner.buildingId,
owner.person.contacts,
building.address buildingAddress
FROM ${bucketName} owner
JOIN ${bucketName} building ON building._documentType = 'building' AND building.id = owner.buildingId
WHERE owner._documentType = 'owner'
AND ANY c IN owner.person.contacts SATISFIES c.\`value\` = $1 END
`

const FoundOwner = t.struct({
  id: t.String,
  buildingId: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    value: t.String,
    type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ])
  })),
  matchingContactId: t.String,
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

export class OwnerRepository extends CouchbaseRepository {
  async setOwnerFeaturedContact (ownerId, featuredContact) {
    const owner = await this.get(ownerId)
    if (!owner) {
      throw new OwnerNotFound(ownerId)
    }

    const updatedOwner = t.update(owner, {
      featuredContact: { $set: featuredContact }
    })

    return this.save(updatedOwner)
  }

  async findByPhoneNumber (phoneNumber) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(findOwnerByContactValueQuery(this.bucketName)),
      [ phoneNumber ]
    ).then(result => fromJSON(result.map(rec => {
      const matchingContactIdx = rec.contacts.findIndex(c => c.value === phoneNumber)
      return { ...rec, matchingContactId: rec.contacts[ matchingContactIdx ].id }
    }), t.list(FoundOwner)))
  }

  struct () {
    return Owner
  }
}

export class OwnerNotFound extends Error {
  constructor (ownerId) {
    super()
    this.message = `Owner with id ${ownerId} not found`
  }
}
