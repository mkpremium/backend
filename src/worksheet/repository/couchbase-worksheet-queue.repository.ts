import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import { WorksheetQueue, WorksheetQueueProps } from '../domain/queue'
import { ScheduledCallInMultipleQueues, WorksheetQueueRepository } from './worksheet-queue.repository'
import t from 'tcomb'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'

export class CouchbaseWorksheetQueueRepository extends CouchbaseRepository<WorksheetQueueProps>
  implements WorksheetQueueRepository {
  constructor (
    protected couchbaseAdapter: CouchbaseAdapter,
  ) {
    super(couchbaseAdapter)
  }

  async list (): Promise<WorksheetQueueProps[]> {
    const rows = await this.couchbaseAdapter.queryAsync(
      this.getQueuesMatchingConditionsQuery([ '1=1' ])
    )

    return fromJSON(rows, t.list(WorksheetQueue))
  }

  struct () {
    return WorksheetQueue
  }

  async findQueueWithScheduledCallOfId (scheduledCallId: string): Promise<WorksheetQueueProps> {
    const rows = await this.couchbaseAdapter.queryAsync(
      this.queueWithScheduledCallOfIdQuery(), [ scheduledCallId ]
    )

    if (rows.length === 0) {
      return
    }
    if (rows.length > 1) {
      throw new ScheduledCallInMultipleQueues(scheduledCallId)
    }
    return fromJSON(rows[ 0 ], WorksheetQueue)
  }

  private queueWithScheduledCallOfIdQuery () {
    return this.getQueuesMatchingConditionsQuery([ 'ANY w IN worksheets SATISFIES w.event.id = $1 END' ])
  }

  private getQueuesMatchingConditionsQuery (conditions: string[]) {
    return `
        SELECT id,
               name,
               source,
               worksheets
        FROM ${this.bucketName}
        WHERE _documentType = 'worksheet-queue'
          AND ${conditions.join(' AND ')}
    `
  }
}

