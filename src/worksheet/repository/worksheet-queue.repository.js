import { WorksheetQueue } from '../domain/worksheet'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'

const queueWithScheduledCallOfIdQuery = bucketName => `
select
    id,
    name,
    source,
    worksheets
from ${bucketName}
where _documentType = 'worksheet-queue' AND ANY w IN worksheets SATISFIES w.event.id = $1 END
`

export class WorksheetQueueRepository extends CouchbaseRepository {
  struct () {
    return WorksheetQueue
  }

  /**
   * @param scheduledCallId
   * @return {Promise<WorksheetQueue>}
   */
  async findQueueWithScheduledCallOfId (scheduledCallId) {
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

class ScheduledCallInMultipleQueues extends Error {
  constructor (scheduledCallId) {
    super('Scheduled called added to more than one queue')
    this.scheduledCallId = scheduledCallId
  }
}
