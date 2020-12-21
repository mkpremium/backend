import { CouchbaseRepository } from '../../db/couchbase.repository'
import { N1qlQuery } from 'couchbase'

export class ScheduledCallsRepository extends CouchbaseRepository {
  removeScheduledCallsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(`
      DELETE FROM ${this.bucketName} WHERE _documentType = 'scheduled-event'
        AND type = 'CALLS' AND event.buildingId = $1
      `),
      [ buildingId ]
    )
  }
}
