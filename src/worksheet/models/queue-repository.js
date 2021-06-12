import Promise from 'bluebird'
import _ from 'lodash'
import _map from 'lodash/map'
import _set from 'lodash/set'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { logger } from '../../infrastructure/logger'
import { newHttpError } from '../../lib/http-error'
import { updateList } from '../../lib/tcomb-utils'
import { ListQuery } from '../../types/params'
import { WorksheetQueue, WorksheetQueueBody, WorksheetQueueSource } from '../domain/queue'
import { WorkSheetCall, WorksheetQueueCount } from '../domain/worksheet'
import { QueueItem, QueueStatus } from './queue-item'
import { LegacyWorksheetRepository } from './worksheet-repository'

const QueueItemExtraInfo = QueueItem.extend({
  totalContacts: t.Number,
  totalBuildings: t.Number,
  ownerName: t.maybe(t.String),
  ownerType: t.maybe(t.String),
  buildingAddress: t.maybe(t.String),
  note: t.maybe(t.String),
  lastCall: t.maybe(WorkSheetCall)
})

const WorksheetQueueExtraInfo = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    size: t.Number,
    source: WorksheetQueueSource,
    worksheets: t.list(QueueItemExtraInfo),

    _documentType: t.enums.of([ 'worksheet-queue' ])
  },
  {
    name: 'WorksheetQueue',
    defaultProps: {
      worksheets: [],
      source: {},
      size: 100,
      _documentType: 'worksheet-queue'
    }
  }
)

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
   * @param {WorksheetQueue} queue
   * @param {string} worksheetId
   * @param {string} operatorId
   * @returns {Promise<WorksheetQueue>}
   */
  async releaseWorksheetByIdInQueue (queue, worksheetId, operatorId) {
    const item = queue.findItemByWorksheetId(worksheetId)

    if (!item) {
      return queue
    }

    return this.releaseItemInQueueAndSave(queue, item, operatorId)
  }

  /**
   * @public
   * @param queueId
   * @param operatorId
   * @returns {Promise<null|*>}
   */
  async findItemByOperator (queueId, operatorId) {
    if (!queueId) {
      return null
    }
    const queue = await this.findByIdOrThrow(queueId)
    return queue.findOpenedItemByOperatorId(operatorId)
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
   * @param queue
   * @returns {Promise<unknown>}
   */
  async findWithExtra (queue) {
    const worksheets = await this.getQueueWorksheets(queue)
    const queueExtraInfo = Object.assign({}, JSON.parse(JSON.stringify(queue)), { worksheets })

    return fromJSON(queueExtraInfo, WorksheetQueueExtraInfo)
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

  /**
   * @private
   * @param {WorksheetQueue} queue
   * @param {QueueItem} item
   * @param {string} operatorId
   * @returns {Promise<unknown>}
   */
  async releaseItemInQueueAndSave (queue, item, operatorId) {
    if (!item.canBeReleased(operatorId)) {
      throw newHttpError(409, `El ${item.id} (${item.status}) no puede ser liberado`)
    }
    logger.info('WorksheetQueueRepository#releaseWorksheetInQueue from queue', {
      worksheetId: item.worksheetId,
      queueId: queue.id
    })
    await this.worksheetRepository.updateStatus(item.worksheetId, operatorId)

    if (item.status !== QueueStatus.SCHEDULED) {
      const updatedQueue = this.removeWorksheetFromQueue(queue, item.worksheetId)
      return this.save(updatedQueue)
    }

    return queue
  }

  /**
   * @private
   * @param queue
   * @param worksheetId
   * @returns {Promise<Object>}
   */
  async removeWorksheetFromQueue (queue, worksheetId) {
    const worksheet = await this.worksheetRepository.findByIdOrThrow(worksheetId)
    const haveEmptyQueueId = _.isNil(worksheet.queueId) || _.isEmpty(worksheet.queueId)
    if (!haveEmptyQueueId && worksheet.queueId !== queue.id) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queueId})`)
    }

    const updatedWorksheet = t.update(worksheet, { $remove: [ 'queueId' ] })
    await this.worksheetRepository.save(updatedWorksheet)

    const updatedWorksheetItems = queue.worksheets.filter(item => item.worksheetId !== worksheet.id)
    return t.update(queue, { worksheets: { $set: updatedWorksheetItems } })
  }

  /**
   * @private
   * @param queue
   * @returns {Promise<Worksheet[]>}
   */
  async getQueueWorksheets (queue) {
    const worksheetIds = _map(queue.worksheets, 'worksheetId')
    const worksheets = await Promise
      .map(worksheetIds, (worksheetId) => this.worksheetRepository.findByIdWIthIncludes(worksheetId))

    return worksheets.map(worksheet => {
      const info = {}
      const item = queue.findItemByWorksheetId(worksheet.id)

      _set(info, 'totalContacts', worksheet.relatedOwners.length)
      _set(info, 'totalBuildings', worksheet.relatedBuildings.length)

      const [ owner ] = worksheet.relatedOwners
      if (owner) {
        _set(info, 'ownerName', owner.person.name)
        _set(info, 'ownerType', owner.type)
      }

      const [ building ] = worksheet.relatedBuildings
      if (building) {
        _set(info, 'buildingAddress', building.address.fullAddress)
      }

      const [ call ] = worksheet.calls
      if (call) {
        _set(info, 'lastCall', call)
      }

      return Object.assign({}, JSON.parse(JSON.stringify(item)), info)
    })
  }
}
