import fromJSON from 'tcomb/lib/fromJSON'
import _get from 'lodash/get'
import { wrap } from 'express-promise-wrap'
import { newHttpError } from '../lib/http-error'
import { QueueRequestParams, WorksheetRepository } from './models/worksheet'
import { WorksheetQueueRepository } from './models/queue'
import { QueueRequestAction } from './types'
import { OperatorRoles } from '../types/operator'
import { History } from '../history/models'
import { OwnerRepository } from '../owner/models'
import { canOperatorHandleQueue } from '../lib/role-operators'
import { WorksheetQueueBody } from './worksheet'

async function worksheetList (req, res) {
  const repo = new WorksheetRepository()
  const worksheets = await repo.list(req.query)
  res.json(worksheets)
}

async function findById (req, res) {
  const id = req.params.id
  const repo = new WorksheetRepository()
  const worksheet = await repo.findByIdWIthIncludes(id)
  res.json(worksheet)
}

function bool (value) {
  return value === 'true'
}

async function createQueue (req, res) {
  const params = fromJSON(req.body, WorksheetQueueBody)
  const repo = new WorksheetQueueRepository()
  const queue = await repo.save(params)
  await History.registerCreate({
    contextModel: queue,
    user: req.user
  })
  res.status(201).json(queue)
}

async function updateQueue (req, res) {
  const repo = new WorksheetQueueRepository()
  const queueId = req.params.id
  const queue = await repo.findByIdOrThrow(queueId)
  const updatedQueue = await repo.update(queue, req.body)
  await History.registerUpdate({
    contextModel: updatedQueue,
    user: req.user
  })
  res.json(updatedQueue)
}

async function deleteQueue (req, res) {
  const repo = new WorksheetQueueRepository()
  const queueId = req.params.id
  const queue = await repo.findByIdOrThrow(queueId)
  await repo.deleteQueue(queue)
  await History.registerDelete({
    contextModel: queue,
    user: req.user
  })
  res.status(204).send()
}

async function getQueue (req, res) {
  const repo = new WorksheetQueueRepository()
  const extra = bool(_get(req.query, 'extra', false))
  const queueId = req.params.id

  const queue = await repo.findByIdOrThrow(queueId)
  canOperatorHandleQueue(req.user.operator, queueId)

  if (extra) {
    const queueWithExtraInfo = await repo.findWithExtra(queue)
    res.json(queueWithExtraInfo)
  } else {
    res.json(queue)
  }
}

async function queueList (req, res) {
  const repo = new WorksheetQueueRepository()
  const queues = await repo.list(req.query)
  res.json(queues)
}

async function actionsOnWorksheetQueue (req, res) {
  const repo = new WorksheetQueueRepository()
  const queueId = req.params.id
  const params = QueueRequestParams(req.body)
  const queue = await repo.findByIdOrThrow(queueId)
  canOperatorHandleQueue(req.user.operator, queueId)

  switch (params.action) {
    case QueueRequestAction.NEXT: {
      const nextWorksheet = await repo.nextWorksheetInQueue(queue, req.user.id)
      if (nextWorksheet === undefined) {
        throw newHttpError(422, 'No hay items disponibles en la lista')
      }
      return res.json(nextWorksheet)
    }
    case QueueRequestAction.TAKE: {
      const worksheet = await repo.takeWorksheetInQueue(queue, params.queueItemId, req.user.id)
      await History.registerTake({
        contextModel: worksheet,
        user: req.user
      })
      return res.json(worksheet)
    }
    case QueueRequestAction.RELEASE: {
      const releasedWorksheet = await repo.releaseWorksheetByIdInQueue(queue, params.worksheetId, req.user.id)
      await History.registerRelease({
        contextModel: releasedWorksheet,
        user: req.user
      })
      return res.status(204).send()
    }
  }
}

function operatorIdByPermissions (req) {
  const allowQuery = req.user.permissions.indexOf(OperatorRoles.MANAGER) !== -1
  return allowQuery
    ? req.query.operationId || req.user.id
    : req.user.id
}

async function queueTakenFindByOperator (req, res) {
  const operatorId = operatorIdByPermissions(req)
  const queueId = req.params.id
  const repo = new WorksheetQueueRepository()
  const queue = await repo.findByIdOrThrow(queueId)
  canOperatorHandleQueue(req.user.operator, queueId)

  const queueItem = queue.findOpenedItemByOperatorId(operatorId)
  await History.registerGet({
    contextModel: queue,
    user: req.user
  })
  res.json(queueItem || {})
}

async function addOwnerToWorksheet (req, res) {
  const worksheetRepo = new WorksheetRepository()
  const ownerRepo = new OwnerRepository()
  const worksheet = await worksheetRepo.findByIdOrThrow(req.params.id)
  const owner = await ownerRepo.createOwnerAndPerson(req.body)
  await worksheetRepo.addOwner(worksheet, owner)
  await History.registerCreate({ contextModel: owner, user: req.user })
  await History.registerUpdate({ contextModel: worksheet, user: req.user })
  res.status(201).json(owner)
}

async function getScheduledWorksheets (req, res) {
  const repo = new WorksheetQueueRepository()
  const queueId = req.params.id
  const operatorId = req.user.id
  const queue = await repo.findByIdOrThrow(queueId)
  const items = queue.findScheduledItemsByOperatorId(operatorId)
  res.json(items)
}

async function removeScheduledWorksheet (req, res) {
  const repo = new WorksheetQueueRepository()
  const queueId = req.params.id
  const operatorId = req.user.id
  const itemId = req.body.itemId

  const queue = await repo.findByIdOrThrow(queueId)
  await repo.removeScheduledWorksheet(queue, itemId, operatorId)

  res.status(204).send()
}

/**
 * Searches worksheets by keyword.
 * @param request
 * @param response
 * @returns {Promise<void>}
 */
async function searchWorksheets (request, response) {
  const repo = new WorksheetRepository()
  const worksheets = await repo.searchWorksheets(request.query)
  response.json(worksheets)
}

export const addOwnerToWorksheetController = wrap(addOwnerToWorksheet)
export const worksheetListController = wrap(worksheetList)
export const worksheetFindByIdController = wrap(findById)
export const getQueueController = wrap(getQueue)
export const queueListController = wrap(queueList)
export const actionsOnWorksheetQueueController = wrap(actionsOnWorksheetQueue)
export const queueTakenFindByOperatorController = wrap(queueTakenFindByOperator)
export const createQueueController = wrap(createQueue)
export const updateQueueController = wrap(updateQueue)
export const deleteQueueController = wrap(deleteQueue)
export const getScheduledWorksheetsController = wrap(getScheduledWorksheets)
export const removeScheduledWorksheetController = wrap(removeScheduledWorksheet)
export const searchWorksheetController = wrap(searchWorksheets)
