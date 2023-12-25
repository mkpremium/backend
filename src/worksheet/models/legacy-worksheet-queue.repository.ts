import BirdPromise from 'bluebird'
import _ from 'lodash'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { logger } from '../../infrastructure/logger'
import { newHttpError } from '../../lib/http-error'
import { updateList } from '../../lib/tcomb-utils'
import { ListQuery } from '../../types/params'
import { WorksheetQueue, WorksheetQueueBody, WorksheetQueueCount, WorksheetQueueProps } from '../domain/queue'
import { LegacyWorksheetRepository } from './worksheet-repository'
import { ScheduledEventProps } from '../../scheduled-events/types'
import _find from 'lodash/find'
import { QueueItem, QueueItemProps, QueueStatus } from './queue-item'
import { WorksheetProps } from '../domain/worksheet'

const QueueListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(WorksheetQueueCount)
  },
  {
    name: 'QueueListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

export class LegacyWorksheetQueueRepository extends CouchbaseModel {
  Struct = WorksheetQueue

  constructor (
    private legacyWorksheetRepository: LegacyWorksheetRepository = new LegacyWorksheetRepository()
  ) {
    super()
  }

  async scheduleWorksheetInQueue (queue: WorksheetQueueProps, scheduledEvent: ScheduledEventProps): Promise<any> {
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

  async findByIdOrThrow (queueId: string): Promise<WorksheetQueueProps> {
    const queue = await this.findById(queueId)
    if (!queue) {
      throw newHttpError(404, `La cola ${queueId} no existe`)
    }

    return fromJSON(queue, WorksheetQueue)
  }

  /**
   * @public
   * @param query
   * @returns {Promise<unknown>}
   */
  async list (query = {}) {
    const params = ListQuery(query)
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset)
    const total = await this.countQuery()
    const results = await this.query(qb)
    const resultsWithCount = await BirdPromise.map(results, async (queue) => {
      const count = await this.legacyWorksheetRepository.countWorksheetsInSource(queue.source)
      return Object.assign(JSON.parse(JSON.stringify(queue)), { possibleNumberOfWorksheets: count })
    })
    return fromJSON({ total, results: resultsWithCount }, QueueListResponse)
  }

  /**
   * @public
   * @param {WorksheetQueue} queue
   * @param params
   * @returns {Promise<unknown>}
   */
  async update (queue, params) {
    const $merge = fromJSON(params, WorksheetQueueBody)
    const updatedQueue = t.update(queue, { $merge })
    return this.save(updatedQueue)
  }

  /**
   * @public
   * @param {WorksheetQueue} queue
   * @returns {Promise<undefined>}
   */
  async deleteQueue (queue) {
    const qb = this.getQueryBuilder('delete')
    qb.where('id = ?', queue.id)
    await this.deleteQuery(qb)
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

function schedule(item: QueueItemProps, operatorId: string, scheduledEvent: ScheduledEventProps): QueueItemProps {
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
