import { N1qlQuery } from 'couchbase'
import t from 'tcomb'
import { Operator } from '../types/operator'

const ACTIVE_PROPERTY_MANAGERS_QUERY = `
    SELECT id, profile.city, username as userName, profitGoal.amount as profitGoal
    FROM mkpremium as propertyManager
    WHERE propertyManager._documentType = 'operator'
    AND enable = true
    AND (ANY V IN roles SATISFIES V = 'BUSINESS' END)
`

export class PropertyManagerRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getActivePropertyManagers () {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(ACTIVE_PROPERTY_MANAGERS_QUERY)
        .consistency(N1qlQuery.Consistency.STATEMENT_PLUS)
    )
  }

  async setFeaturedOwnerForBuildingAndPropertyManager (propertyAgentId, buildingId, ownerId) {
    const propertyAgent = await this.couchbaseAdapter.getEntity(Operator, propertyAgentId)
    const agentFeaturedOwner = (propertyAgent.featuredOwners || []).filter(fo => fo.buildingId !== buildingId)
    const updatedPropertyAgent = t.update(propertyAgent, {
      featuredOwners: {
        $set: [ ...(agentFeaturedOwner), {
          buildingId, ownerId
        } ]
      }
    })

    return this.couchbaseAdapter.save(updatedPropertyAgent, Operator)
  }
}
