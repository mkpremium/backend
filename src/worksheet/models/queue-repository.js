import Promise from 'bluebird'
import _ from 'lodash'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { logger } from '../../infrastructure/logger'
import { newHttpError } from '../../lib/http-error'
import { updateList } from '../../lib/tcomb-utils'
import { ListQuery } from '../../types/params'
import { WorksheetQueue, WorksheetQueueBody, WorksheetQueueCount } from '../domain/queue'
import { LegacyWorksheetRepository } from './worksheet-repository'

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

/**
 * @field {WorksheetRepository} worksheetRepository
 */
export class LegacyWorksheetQueueRepository extends CouchbaseModel {
  constructor (
    legacyWorksheetRepository = new LegacyWorksheetRepository()
  ) {
    super()
    this.Struct = WorksheetQueue
    this.worksheetRepository = legacyWorksheetRepository
  }

  /**
   * @public
   * @param {WorksheetQueue} queue
   * @param {ScheduledEvent} scheduledEvent
   * @returns {Promise<QueueItem>}
   */
  async scheduleWorksheetInQueue (queue, scheduledEvent) {
    const worksheetId = scheduledEvent.event.worksheetId
    const worksheet = await this.worksheetRepository.findById(worksheetId)
    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${worksheetId} no puede abrirse, comuníquese con su administrador`)
    }

    const operatorId = scheduledEvent.notifyTo
    let item = queue.findItemByWorksheetId(worksheetId)
    if (!item) {
      queue = queue.addWorksheet(worksheet)
      item = _.find(queue.worksheets, i => i.worksheetId === worksheetId)
    }

    const updatedItem = item.schedule(operatorId, scheduledEvent)
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem)
    const updatedQueue = t.update(queue, { worksheets: { $set: updatedWorksheets } })

    logger.info('WorksheetQueueRepository#scheduleWorksheetInQueue worksheet from queue', {
      worksheetId: worksheet.id,
      queueId: queue.id
    })

    await this.save(updatedQueue)

    return updatedItem
  }

  /**
   * @public
   * @param queueId
   * @returns {Promise<WorksheetQueue>}
   */
  async findByIdOrThrow (queueId) {
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
    const resultsWithCount = await Promise.map(results, async (queue) => {
      const count = await this.worksheetRepository.countWorksheetsInSource(queue.source)
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
