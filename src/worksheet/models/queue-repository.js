import Promise from 'bluebird'
import _ from 'lodash'
import _get from 'lodash/get'
import _map from 'lodash/map'
import _set from 'lodash/set'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { CouchbaseModel } from '../../db/model'
import { logger } from '../../infrastructure/logger'
import { utc } from '../../lib/date'
import { newHttpError } from '../../lib/http-error'
import { updateList } from '../../lib/tcomb-utils'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'
import {
  Worksheet,
  WorkSheetCall,
  WorksheetQueue,
  WorksheetQueueBody,
  WorksheetQueueCount,
  WorksheetQueueSource
} from '../worksheet'
import { QueueItem, QueueStatus } from './queue-item'
import { WorksheetRepository } from './worksheet'

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

export class WorksheetQueueRepository extends CouchbaseModel {
  constructor (
    worksheetRepository = new WorksheetRepository()
  ) {
    super()
    this.Struct = WorksheetQueue
    this.worksheetRepository = worksheetRepository
  }

  /**
   * @public
   * @param {WorksheetQueue} queue
   * @param {ScheduledEvent} scheduledEvent
   * @returns {Promise<QueueItem>}
   */
  async scheduleWorksheetInQueue (queue, scheduledEvent) {
    const worksheetId = scheduledEvent.event.worksheetId
    const operatorId = scheduledEvent.notifyTo
    const item = queue.findItemByWorksheetId(worksheetId)
    if (!item) {
      throw newHttpError(400, `La Worksheet ${worksheetId} no fue encontrada en la cola`)
    }

    const worksheet = await this.worksheetRepository.findById(item.worksheetId)

    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${item.worksheetId} no puede abrirse, comuníquese con su administrador`)
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
   * @param {string} operatorId
   * @returns {Promise<Worksheet>}
   */
  async nextWorksheetInQueue (queue, operatorId) {
    const operatorItem = queue.findOpenedItemByOperatorId(operatorId)
    let nextAvailableItem = queue.findNextAvailableInQueue(operatorItem)
    let updatedQueue = queue

    // add worksheet only if the bag it's empty
    if (!nextAvailableItem) {
      updatedQueue = await this.findNextAvailableInSource(queue)
      nextAvailableItem = updatedQueue.findNextAvailableInQueue(operatorItem)
    }

    if (!nextAvailableItem) {
      return
    }

    const releasedUpdatedQueue = operatorItem
      ? await this.releaseWorksheetInQueue(updatedQueue, operatorItem.id, operatorId)
      : updatedQueue

    return this.takeWorksheetInQueue(releasedUpdatedQueue, nextAvailableItem.id, operatorId)
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
   * @returns {Promise<void>}
   */
  async releaseWorksheetTakenByOperatorOfId (queueId, operatorId) {
    const queue = await this.findByIdOrThrow(queueId)
    const operatorItem = queue.findOpenedItemByOperatorId(operatorId)

    if (operatorItem) {
      await this.releaseItemInQueueAndSave(queue, operatorItem, operatorId)
    }
  }

  /**
   * @public
   * @param {WorksheetQueue} queue
   * @param itemId
   * @param operatorId
   * @returns {Promise<WorksheetQueue>}
   */
  async removeScheduledWorksheet (queue, itemId, operatorId) {
    const item = queue.findItemById(itemId)

    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`)
    }

    const updatedItem = item.releaseSchedule(operatorId)
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem)
    const updatedQueue = t.update(queue, { worksheets: { $set: updatedWorksheets } })

    logger.info('WorksheetQueueRepository#removeScheduledWorksheet', {
      worksheetId: item.worksheetId,
      queueId: queue.id
    })

    await this.save(updatedQueue)
  }

  /**
   * @public
   * @param data
   * @param itemId
   * @param operatorId
   * @returns {Promise<Worksheet>}
   */
  async takeWorksheetInQueue (data, itemId, operatorId) {
    const queue = fromJSON(data, WorksheetQueue)
    const item = queue.findItemById(itemId)
    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`)
    }

    if (!item.canBeOpened(operatorId)) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no esta disponible para su apertura`)
    }

    const operatorItem = queue.findOpenedItemByOperatorId(operatorId)

    if (operatorItem && operatorItem.id !== item.id) {
      throw newHttpError(409, `El operador ${operatorId} ya ha tomado un item previamente ${operatorItem.id}`)
    }

    const worksheet = await this.worksheetRepository.findByIdWIthIncludes(item.worksheetId)

    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${item.worksheetId} no puede abrirse, comuníquese con su administrador`)
    }

    const updatedWorksheet = t.update(worksheet, { viewedAt: { $set: utc().toDate() } })
    await this.worksheetRepository.save(updatedWorksheet)

    const updatedItem = item.take(operatorId)
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem)
    const updatedQueue = t.update(queue, { worksheets: { $set: updatedWorksheets } })

    logger.info('WorksheetQueueRepository#takeWorksheetInQueue', {
      worksheetId: worksheet.id,
      status: worksheet.status,
      queueId: queue.id
    })

    await this.save(updatedQueue)

    if (!operatorItem) {
      const city = _get(worksheet, 'relatedBuildings.0.address.city')
      const province = _get(worksheet, 'relatedBuildings.0.address.province')
      await OperatorStats.registerAction(operatorId, OperatorActions.VIEW_WORKSHEET, { city, province })
    }

    return this.worksheetRepository.findByIdWIthIncludes(updatedItem.worksheetId)
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
    const params = t.ListQuery(query)
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
    await this.worksheetRepository.updateWorkSheetStatus(item.worksheetId, operatorId)

    if (item.status !== QueueStatus.SCHEDULED) {
      const updatedQueue = this.removeWorksheetFromQueue(queue, item.worksheetId)
      return this.save(updatedQueue)
    }

    return queue
  }

  /**
   * @private
   */
  async releaseWorksheetInQueue (queue, itemId, operatorId) {
    const item = queue.findItemById(itemId)

    if (!item) {
      return queue
    }

    if (!item.canBeReleased(operatorId)) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no puede ser liberado`)
    }

    return this.releaseItemInQueue(queue, item, operatorId)
  }

  /**
   * @private
   * @param queue
   * @param item
   * @param operatorId
   * @returns {Promise<Object|*>}
   */
  async releaseItemInQueue (queue, item, operatorId) {
    logger.info('WorksheetQueueRepository#releaseItemInQueue', { worksheetId: item.worksheetId, queueId: queue.id })
    await this.worksheetRepository.updateWorkSheetStatus(item.worksheetId, operatorId)

    if (item.status !== QueueStatus.SCHEDULED) {
      return this.removeWorksheetFromQueue(queue, item.worksheetId)
    }

    return queue
  }

  /**
   * @private
   * @param {WorksheetQueue} queue
   * @param worksheet
   * @returns {Promise<WorksheetQueue>}
   */
  async addWorksheetToQueue (queue, worksheet) {
    if (worksheet.queueId) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queueId})`)
    }
    logger.info('WorksheetQueueRepository#addWorksheetToQueue worksheet to queue', {
      worksheetId: worksheet.id,
      queueId: queue.id
    })

    await this.worksheetRepository.save(t.update(worksheet, { queueId: { $set: queue.id } }))

    const updatedWorksheets = t.update(queue.worksheets, {
      $push: [ QueueItem({
        worksheetId: worksheet.id,
        id: uuid()
      }) ]
    })
    const updatedQueue = t.update(queue, {
      worksheets: { $set: updatedWorksheets },
      worksheetIndex: { $set: worksheet.worksheetIndex }
    })

    return fromJSON(updatedQueue, WorksheetQueue)
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
   * @param {WorksheetQueue} queue
   * @returns {Promise<WorksheetQueue|*>}
   */
  async findNextAvailableInSource (queue) {
    const [ rawWorksheet ] = await this.worksheetRepository.findBySource(queue)

    if (rawWorksheet) {
      return this.addWorksheetToQueue(queue, fromJSON(rawWorksheet, Worksheet))
    }

    return queue
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
