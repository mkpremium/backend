import { Struct } from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { ScheduledEvent, ScheduledEventProps } from '../types'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'

export class ScheduledCallsRepository extends CouchbaseRepository<ScheduledEventProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return ScheduledEvent;
  }

  removeScheduledCallsForBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      `DELETE FROM ${this.bucketName} WHERE _documentType = 'scheduled-event'
        AND type = 'CALLS' AND event.buildingId = $1`,
      [ buildingId ]
    )
  }

  removeScheduledCallsForContact (contactId: string) {
    return this.couchbaseAdapter.queryAsync(
      `DELETE FROM ${this.bucketName} WHERE _documentType = 'scheduled-event'
        AND type = 'CALLS' AND event.contactId = $1`,
      [ contactId ]
    )
  }

  forBuilding (buildingId: string): TE.TaskEither<Error, string | undefined>{
    return pipe(
      fromPromise(this.couchbaseAdapter.queryAsync(
        `SELECT scheduledCall.* FROM ${this.bucketName} WHERE _documentType = 'scheduled-event'
                                                          AND type = 'CALLS' AND event.buildingId = $1`,
        [buildingId]
      )),
      TE.map(rows => {
        if (!rows || rows.length === 0) {
          return
        }
        return rows[0].id
      })
    )
  }
}
