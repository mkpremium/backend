import { CouchbaseRepository } from '../../db/couchbase.repository'

export class ScheduledCallsRepository extends CouchbaseRepository {
  removeScheduledCallsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      `DELETE FROM ${this.bucketName} WHERE _documentType = 'scheduled-event'
        AND type = 'CALLS' AND event.buildingId = $1`,
      [ buildingId ]
    )
  }
}
