import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import { WorksheetQueue, WorksheetQueueProps } from '../domain/queue'
import { ScheduledCallInMultipleQueues, WorksheetQueueRepository } from './worksheet-queue.repository'

const queueWithScheduledCallOfIdQuery = bucketName => `
    SELECT id,
           name,
           source,
           worksheets
    FROM ${bucketName}
    WHERE _documentType = 'worksheet-queue'
      AND ANY w IN worksheets SATISFIES w.event.id = $1 END
`

export class CouchbaseWorksheetQueueRepository extends CouchbaseRepository<WorksheetQueueProps>
  implements WorksheetQueueRepository {
  struct () {
    return WorksheetQueue
  }

  async findQueueWithScheduledCallOfId (scheduledCallId: string): Promise<WorksheetQueueProps> {
    return this.couchbaseAdapter.queryAsync(
      queueWithScheduledCallOfIdQuery(this.bucketName), [ scheduledCallId ]
    ).then(rows => {
      if (rows.length === 0) {
        return
      }
      if (rows.length > 1) {
        throw new ScheduledCallInMultipleQueues(scheduledCallId)
      }
      return fromJSON(rows[ 0 ], WorksheetQueue)
    })
  }
}
