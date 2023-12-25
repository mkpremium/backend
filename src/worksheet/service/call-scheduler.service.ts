import { WorksheetQueueProps } from '../domain/queue'
import { ScheduledEventProps } from '../../scheduled-events/types'
import { QueueItem, QueueItemProps, QueueStatus } from '../models/queue-item'
import { newHttpError } from '../../lib/http-error'
import _ from 'lodash'
import { updateList } from '../../lib/tcomb-utils'
import t from 'tcomb'
import { logger } from '../../infrastructure/logger'
import { CouchbaseWorksheetQueueRepository } from '../repository/couchbase-worksheet-queue.repository'
import { LegacyWorksheetRepository } from '../models/worksheet-repository'
import _find from 'lodash/find'
import { WorksheetProps } from '../domain/worksheet'

export class CallSchedulerService {
  constructor (
    private legacyWorksheetRepository: LegacyWorksheetRepository,
    private couchbaseWorksheetQueueRepository: CouchbaseWorksheetQueueRepository,
  ) {
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

    await this.couchbaseWorksheetQueueRepository.save(updatedQueue)

    return updatedItem
  }
}

export function addWorksheet (queue: WorksheetQueueProps, worksheet: WorksheetProps): WorksheetQueueProps {
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

function findItemByWorksheetId (queue: WorksheetQueueProps, worksheetId: string): QueueItemProps | undefined {
  return _find(queue.worksheets, { worksheetId })
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
