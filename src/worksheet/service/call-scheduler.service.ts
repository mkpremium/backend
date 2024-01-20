import { WorksheetQueue, WorksheetQueueProps } from '../domain/queue'
import { ScheduledEventProps } from '../../scheduled-events/types'
import { QueueItem, QueueItemProps, QueueItemStatus } from '../models/queue-item'
import { newHttpError } from '../../lib/http-error'
import _ from 'lodash'
import t from 'tcomb'
import _find from 'lodash/find'
import { WorksheetProps } from '../domain/worksheet'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { Logger } from 'winston'

export class CallSchedulerService {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private logger: Logger,
  ) {
  }

  async scheduleWorksheetInQueue (queue: WorksheetQueueProps, scheduledEvent: ScheduledEventProps): Promise<QueueItemProps> {
    const worksheetId = scheduledEvent.event.worksheetId
    const worksheet = await this.worksheetRepository.get(worksheetId)
    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${worksheetId} no puede abrirse, comuníquese con su administrador`)
    }

    const operatorId = scheduledEvent.notifyTo
    let item = findItemByWorksheetId(queue, worksheetId)
    if (!item) {
      this.logger.warning('Worksheet added to queue while scheduling', {worksheetId: worksheet.id, queueId: queue.id})
      queue = addWorksheet(queue, worksheet)
      item = _.find(queue.worksheets, i => i.worksheetId === worksheetId)
    }

    const updatedItem = schedule(item, operatorId, scheduledEvent)
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem)
    const updatedQueue = WorksheetQueue.update(queue, { worksheets: { $set: updatedWorksheets } })

    this.logger.info('WorksheetQueueRepository#scheduleWorksheetInQueue worksheet from queue', {
      worksheetId: worksheet.id,
      queueId: queue.id
    })

    await this.worksheetQueueRepository.save(updatedQueue)

    return updatedItem
  }
}

export function addWorksheet (queue: WorksheetQueueProps, worksheet: WorksheetProps): WorksheetQueueProps {
  return WorksheetQueue.update(queue, {
    worksheets: {
      $push: [
        QueueItem({
          worksheetId: worksheet.id,
          status: QueueItemStatus.AVAILABLE,
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
  return QueueItem.update(item, {
    status: { $set: QueueItemStatus.SCHEDULED },
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

function updateList (list, currentItem, newValues) {
  const index = list.indexOf(currentItem)
  return t.update(list, { [index]: { $set: newValues } })
}
