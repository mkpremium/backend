import { N1qlQuery } from 'couchbase'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { Operator } from '../types/operator'

const ACTIVE_PROPERTY_MANAGERS_QUERY = `
    SELECT id, profile.city, username as userName, profitGoal.amount as profitGoal
    FROM mkpremium as propertyManager
    WHERE propertyManager._documentType = 'operator'
    AND enable = true
    AND (ANY V IN roles SATISFIES V = 'BUSINESS' END)
`

export class PropertyManagerRepository {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
    this.couchbaseAdapter = new CouchbaseAdapter(couchbaseBucket)
  }

  getActivePropertyManagers () {
    return this.couchbaseBucket.queryAsync(
      N1qlQuery.fromString(ACTIVE_PROPERTY_MANAGERS_QUERY)
        .consistency(N1qlQuery.Consistency.STATEMENT_PLUS)
    )
  }

  async setFeaturedOwnerForBuildingAndPropertyManager (propertyAgentId, buildingId, ownerId) {
    const propertyAgent = await this.couchbaseAdapter.getEntity(Operator, propertyAgentId)
    const updatedPropertyAgent = t.update(propertyAgent, {
      featuredOwners: {
        $set: [ {
          buildingId, ownerId
        } ]
      }
    })

    return this.couchbaseAdapter.save(updatedPropertyAgent, Operator)
  }
}

class CouchbaseAdapter {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
  }

  async save (data, structType) {
    const struct = fromJSON(data, structType)
    const dataWithId = t.update(struct, { id: { $set: data.id || uuid() } })

    const result = await this.couchbaseBucket.upsertToDb(dataWithId.id, dataWithId)

    return fromJSON(result, structType)
  }

  async getEntity (structType, entityId) {
    const result = await this.couchbaseBucket.getAsync(entityId)
    if (!(result && result.value)) {
      return null
    }

    return fromJSON(result.value, structType)
  }
}
