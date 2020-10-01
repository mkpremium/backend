import Promise from 'bluebird'
import t from 'tcomb'
import { logger } from '../../infrastructure/logger'
import fromJSON from 'tcomb/lib/fromJSON'
import _ from 'lodash'
import _map from 'lodash/map'
import _set from 'lodash/set'
import _get from 'lodash/get'
import { CouchbaseModel } from '../../db/model'
import { newHttpError } from '../../lib/http-error'
import { updateList } from '../../lib/tcomb-utils'
import { WorksheetRepository } from './worksheet'
import { utc } from '../../lib/date'
import {
  WorkSheetCall,
  WorksheetQueue,
  WorksheetQueueBody,
  WorksheetQueueCount,
  WorksheetQueueSource
} from '../../types/worksheet'
import { OperatorActions } from '../../stats/types'
import { OperatorStats } from '../../stats/models'
import uuid from 'uuid/v4'
import { QueueItem, QueueStatus } from './queue-item'

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

export class QueueItemRepository {
  async save (data) {
    const queueItem = QueueItem(data)
    return t.update(queueItem, { id: { $set: data.id || uuid() } })
  }
}

export class WorksheetQueueRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = WorksheetQueue
  }

  async findByIdOrThrow (queueId) {
    const queue = await this.findById(queueId)
    if (!queue) {
      throw newHttpError(404, `La cola ${queueId} no existe`)
    }

    return fromJSON(queue, WorksheetQueue)
  }

  async getExtraInfo (queue) {
    const worksheetIds = _map(queue.worksheets, 'worksheetId')
    const worksheetRepo = new WorksheetRepository()
    const worksheets = await Promise
      .map(worksheetIds, (worksheetId) => worksheetRepo.findByIdWIthIncludes(worksheetId))

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

  async findWithExtra (queue) {
    const worksheets = await this.getExtraInfo(queue)
    const queueExtraInfo = Object.assign({}, JSON.parse(JSON.stringify(queue)), { worksheets })

    return fromJSON(queueExtraInfo, WorksheetQueueExtraInfo)
  }

  async list (query = {}) {
    const wsRepo = new WorksheetRepository()
    const params = t.ListQuery(query)
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset)
    const total = await this.countQuery()
    const results = await this.query(qb)
    const resultsWithCount = await Promise.map(results, async (queue) => {
      const count = await wsRepo.countWorksheetsInSource(queue.source)
      return Object.assign(JSON.parse(JSON.stringify(queue)), { possibleNumberOfWorksheets: count })
    })
    return fromJSON({ total, results: resultsWithCount }, QueueListResponse)
  }

  async addWorksheetToQueue (queue, worksheetId) {
    const worksheetRepo = new WorksheetRepository()
    const worksheet = await worksheetRepo.findByIdOrThrow(worksheetId)
    if (worksheet.queueId) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queueId})`)
    }
    logger.info('WorksheetQueueRepository#addWorksheetToQueue worksheet to queue', {
      worksheetId: worksheet.id,
      queueId: queue.id
    }
    )

    await worksheetRepo.save(t.update(worksheet, { queueId: { $set: queue.id } }))

    const itemRepo = new QueueItemRepository()
    const item = await itemRepo.save({ worksheetId: worksheet.id })
    const updatedWorksheets = t.update(queue.worksheets, { $push: [ item ] })
    const updatedQueue = t.update(queue, {
      worksheets: { $set: updatedWorksheets },
      worksheetIndex: { $set: worksheet.worksheetIndex }
    })

    return fromJSON(updatedQueue, WorksheetQueue)
  }

  async removeWorksheetInQueue (queue, worksheetId) {
    const worksheetRepo = new WorksheetRepository()
    const worksheet = await worksheetRepo.findByIdOrThrow(worksheetId)
    const haveEmptyQueueId = _.isNil(worksheet.queueId) || _.isEmpty(worksheet.queueId)
    if (!haveEmptyQueueId && worksheet.queueId !== queue.id) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queueId})`)
    }

    const updatedWorksheet = t.update(worksheet, { $remove: [ 'queueId' ] })
    await worksheetRepo.save(updatedWorksheet)

    const updatedWorksheetItems = queue.worksheets.filter(item => item.worksheetId !== worksheet.id)
    return t.update(queue, { worksheets: { $set: updatedWorksheetItems } })
  }

  async removeWorksheet (queueId, worksheetId) {
    const queue = await this.findByIdOrThrow(queueId)
    return this.removeWorksheetInQueue(queue, worksheetId)
  }

  async removeWorksheetAndSave (queueId, worksheetId) {
    const updatedQueue = await this.removeWorksheet(queueId, worksheetId)
    return this.save(updatedQueue)
  }

  async scheduleWorksheetInQueue (queue, scheduledEvent) {
    const worksheetId = scheduledEvent.event.worksheetId
    const operatorId = scheduledEvent.notifyTo
    const item = queue.findItemByWorksheetId(worksheetId)
    if (!item) {
      throw newHttpError(400, `La Worksheet ${worksheetId} no fue encontrada en la cola`)
    }

    const worksheetRepo = new WorksheetRepository()
    const worksheet = await worksheetRepo.findById(item.worksheetId)

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

    const worksheetRepo = new WorksheetRepository()
    const worksheet = await worksheetRepo.findByIdWIthIncludes(item.worksheetId)

    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${item.worksheetId} no puede abrirse, comuníquese con su administrador`)
    }

    const updatedWorksheet = t.update(worksheet, { viewedAt: { $set: utc().toDate() } })
    await worksheetRepo.save(updatedWorksheet)

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

    return worksheetRepo.findByIdWIthIncludes(updatedItem.worksheetId)
  }

  async update (queue, params) {
    const $merge = fromJSON(params, WorksheetQueueBody)
    const updatedQueue = t.update(queue, { $merge })
    return this.save(updatedQueue)
  }

  async deleteQueue (queue) {
    const qb = this.getQueryBuilder('delete')
    qb.where('id = ?', queue.id)
    return this.deleteQuery(qb)
  }

  async releaseWorksheetByIdInQueue (queue, worksheetId, operatorId) {
    const item = queue.findItemByWorksheetId(worksheetId)

    if (!item) {
      throw newHttpError(400, `La worksheet ${worksheetId} no fue encontrada en la cola`)
    }

    if (!item.canBeReleased(operatorId)) {
      throw newHttpError(409, `El ${item.id} (${item.status}) no puede ser liberado`)
    }

    return this.releaseItemInQueueAndSave(queue, item, operatorId)
  }

  async releaseWorksheetInQueueAndSave (queue, itemId, operatorId) {
    const item = queue.findItemById(itemId)

    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`)
    }

    if (!item.canBeReleased(operatorId)) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no puede ser liberado`)
    }

    return this.releaseItemInQueueAndSave(queue, item, operatorId)
  }

  async releaseWorksheetInQueue (queue, itemId, operatorId) {
    const item = queue.findItemById(itemId)

    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`)
    }

    if (!item.canBeReleased(operatorId)) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no puede ser liberado`)
    }

    return this.releaseItemInQueue(queue, item, operatorId)
  }

  async releaseItemInQueueAndSave (queue, item, operatorId) {
    logger.info('WorksheetQueueRepository#releaseWorksheetInQueue from queu', {
      worksheetId: item.worksheetId,
      queueId: queue.id
    })
    await new WorksheetRepository().updateWorkSheetStatus(item.worksheetId, operatorId)

    if (item.status !== QueueStatus.SCHEDULED) {
      return this.removeWorksheetAndSave(queue.id, item.worksheetId)
    }

    return queue
  }

  async releaseItemInQueue (queue, item, operatorId) {
    logger.info('WorksheetQueueRepository#releaseItemInQueue', { worksheetId: item.worksheetId, queueId: queue.id })
    await new WorksheetRepository().updateWorkSheetStatus(item.worksheetId, operatorId)

    if (item.status !== QueueStatus.SCHEDULED) {
      return this.removeWorksheetInQueue(queue, item.worksheetId)
    }

    return queue
  }

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
      throw newHttpError(422, 'No hay items disponibles en la lista')
    }

    const releasedUpdatedQueue = operatorItem
      ? await this.releaseWorksheetInQueue(updatedQueue, operatorItem.id, operatorId)
      : updatedQueue

    return this.takeWorksheetInQueue(releasedUpdatedQueue, nextAvailableItem.id, operatorId)
  }

  async findNextAvailableInSource (queue) {
    const worksheetRepo = new WorksheetRepository()
    const [ worksheet ] = await worksheetRepo.findBySource(queue)

    if (worksheet) {
      return this.addWorksheetToQueue(queue, worksheet.id)
    }

    return queue
  }

  async findItemByOperator (queueId, operatorId) {
    if (!queueId) {
      return null
    }
    const queue = await this.findByIdOrThrow(queueId)
    return queue.findOpenedItemByOperatorId(operatorId)
  }

  async releaseTakenWorksheetInQueue (queueId, operatorId) {
    const queue = await this.findByIdOrThrow(queueId)
    const operatorItem = queue.findOpenedItemByOperatorId(operatorId)

    if (operatorItem) {
      await this.releaseWorksheetInQueueAndSave(queue, operatorItem.id, operatorId)
    }
  }
}
