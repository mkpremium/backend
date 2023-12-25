import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import { WorksheetQueue, WorksheetQueueProps } from '../domain/queue'
import { ScheduledCallInMultipleQueues, WorksheetQueueRepository } from './worksheet-queue.repository'
import { ScheduledEventProps } from '../../scheduled-events/types'
import { QueueItem, QueueItemProps, QueueStatus } from '../models/queue-item'
import { newHttpError } from '../../lib/http-error'
import _ from 'lodash'
import { updateList } from '../../lib/tcomb-utils'
import t from 'tcomb'
import { logger } from '../../infrastructure/logger'
import { LegacyWorksheetRepository } from '../models/worksheet-repository'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import _find from 'lodash/find'
import { WorksheetProps } from '../domain/worksheet'

export class CouchbaseWorksheetQueueRepository extends CouchbaseRepository<WorksheetQueueProps>
  implements WorksheetQueueRepository {
  constructor (
    protected couchbaseAdapter: CouchbaseAdapter,
    private legacyWorksheetRepository: LegacyWorksheetRepository,
  ) {
    super(couchbaseAdapter)
  }

  async list (): Promise<WorksheetQueueProps[]> {
    const rows = await this.couchbaseAdapter.queryAsync(
      this.getQueuesMatchingConditionsQuery([ '1=1' ])
    )

    return fromJSON(rows, t.list(WorksheetQueue))
  }

  delete (id: string): Promise<void> {
    throw new Error('Method not implemented.')
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

  async scheduleWorksheetInQueue (queue: WorksheetQueueProps, scheduledEvent: ScheduledEventProps): Promise<QueueItemProps> {
    const worksheetId = scheduledEvent.event.worksheetId
    const worksheet = await this.legacyWorksheetRepository.findById(worksheetId)
    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${worksheetId} no puede abrirse, comuníquese con su administrador`)
    }

    const operatorId = scheduledEvent.notifyTo
    let item = findItemByWorksheetId(queue, worksheetId)
    if (!item) {
      queue = addWorksheet(queue, worksheet)
      item = _.find(queue.worksheets, i => i.worksheetId === worksheetId)
    }

    const updatedItem = schedule(item, operatorId, scheduledEvent)
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem)
    const updatedQueue = t.update(queue, { worksheets: { $set: updatedWorksheets } })

    logger.info('WorksheetQueueRepository#scheduleWorksheetInQueue worksheet from queue', {
      worksheetId: worksheet.id,
      queueId: queue.id
    })

    await this.save(updatedQueue)

    return updatedItem
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

function findItemByWorksheetId (queue: WorksheetQueueProps, worksheetId: string): QueueItemProps | undefined {
  return _find(queue.worksheets, { worksheetId })
}

function addWorksheet (queue: WorksheetQueueProps, worksheet: WorksheetProps): WorksheetQueueProps {
  return t.update(queue, {
    worksheets: {
      $push: [
        QueueItem({
          worksheetId: worksheet.id,
          status: QueueStatus.AVAILABLE,
          addedAt: new Date()
        })
      ]
    }
  }) as WorksheetQueueProps
}

function schedule (item: QueueItemProps, operatorId: string, scheduledEvent: ScheduledEventProps): QueueItemProps {
  return t.update(item, {
    status: { $set: QueueStatus.SCHEDULED },
    operatorId: { $set: operatorId },
    event: {
      $set: {
        id: scheduledEvent.id,
        type: scheduledEvent.type,
        eventDate: scheduledEvent.eventDate
      }
    }
  }) as QueueItemProps
}
