import { wrap } from 'express-promise-wrap'
import _get from 'lodash/get'
import fromJSON from 'tcomb/lib/fromJSON'
import { History } from '../history/models'
import { newHttpError } from '../lib/http-error'
import { canOperatorHandleQueue } from '../lib/role-operators'
import { OwnerRepository } from '../owner/models'
import { OperatorRoles } from '../types/operator'
import { QueueRequestParams, LegacyWorksheetRepository } from './models/worksheet-repository'
import { QueueRequestAction } from './types'
import { WorksheetQueueBody } from './domain/worksheet'

async function worksheetList (req, res) {
  const repo = new LegacyWorksheetRepository()
  const worksheets = await repo.list(req.query)
  res.json(worksheets)
}

async function findById (req, res) {
  const id = req.params.id
  const repo = new LegacyWorksheetRepository()
  const worksheet = await repo.findByIdWIthIncludes(id)
  res.json(worksheet)
}

function bool (value) {
  return value === 'true'
}

const createQueue = worksheetQueueRepository => async (req, res) => {
  const params = fromJSON(req.body, WorksheetQueueBody)
  const queue = await worksheetQueueRepository.save(params)
  await History.registerCreate({
    contextModel: queue,
    user: req.user
  })
  res.status(201).json(queue)
}

const updateQueue = worksheetQueueRepository => async (req, res) => {
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  const updatedQueue = await worksheetQueueRepository.update(queue, req.body)
  await History.registerUpdate({
    contextModel: updatedQueue,
    user: req.user
  })
  res.json(updatedQueue)
}

const deleteQueue = worksheetQueueRepository => async (req, res) => {
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  await worksheetQueueRepository.deleteQueue(queue)
  await History.registerDelete({
    contextModel: queue,
    user: req.user
  })
  res.status(204).send()
}

const getQueue = worksheetQueueRepository => async (req, res) => {
  const extra = bool(_get(req.query, 'extra', false))
  const queueId = req.params.id

  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  canOperatorHandleQueue(req.user.operator, queueId)

  if (extra) {
    const queueWithExtraInfo = await worksheetQueueRepository.findWithExtra(queue)
    res.json(queueWithExtraInfo)
  } else {
    res.json(queue)
  }
}

const queueList = worksheetQueueRepository => async (req, res) => {
  const queues = await worksheetQueueRepository.list(req.query)
  res.json(queues)
}

/**
 * @param {LegacyWorksheetQueueRepository} worksheetQueueRepository
 * @param {TakeNextWorksheetService} takeNextWorksheetService
 */
const actionsOnWorksheetQueue = (worksheetQueueRepository, takeNextWorksheetService) => async (req, res) => {
  const queueId = req.params.id
  const params = QueueRequestParams(req.body)
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  canOperatorHandleQueue(req.user.operator, queueId)

  switch (params.action) {
    case QueueRequestAction.NEXT: {
      const nextWorksheet = await takeNextWorksheetService.nextWorksheetInQueue(queue, req.user.id)
      if (nextWorksheet === undefined) {
        throw newHttpError(422, 'No hay items disponibles en la lista')
      }
      return res.json(nextWorksheet)
    }
    case QueueRequestAction.TAKE: {
      const worksheet = await worksheetQueueRepository.takeWorksheetInQueue(queue, params.queueItemId, req.user.id)
      await History.registerTake({
        contextModel: worksheet,
        user: req.user
      })
      return res.json(worksheet)
    }
    case QueueRequestAction.RELEASE: {
      const releasedWorksheet = await worksheetQueueRepository.releaseWorksheetByIdInQueue(queue, params.worksheetId, req.user.id)
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

const queueTakenFindByOperator = worksheetQueueRepository => async (req, res) => {
  const operatorId = operatorIdByPermissions(req)
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  canOperatorHandleQueue(req.user.operator, queueId)

  const queueItem = queue.findOpenedItemByOperatorId(operatorId)
  await History.registerGet({
    contextModel: queue,
    user: req.user
  })
  res.json(queueItem || {})
}

async function addOwnerToWorksheet (req, res) {
  const worksheetRepo = new LegacyWorksheetRepository()
  const ownerRepo = new OwnerRepository()
  const worksheet = await worksheetRepo.findByIdOrThrow(req.params.id)
  const owner = await ownerRepo.createOwnerAndPerson(req.body)
  await worksheetRepo.addOwner(worksheet, owner)
  await History.registerCreate({ contextModel: owner, user: req.user })
  await History.registerUpdate({ contextModel: worksheet, user: req.user })
  res.status(201).json(owner)
}

const getScheduledWorksheets = worksheetQueueRepository => async (req, res) => {
  const queueId = req.params.id
  const operatorId = req.user.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  const items = queue.findScheduledItemsByOperatorId(operatorId)
  res.json(items)
}

const removeScheduledWorksheet = worksheetQueueRepository => async (req, res) => {
  const queueId = req.params.id
  const operatorId = req.user.id
  const itemId = req.body.itemId

  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  await worksheetQueueRepository.removeScheduledWorksheet(queue, itemId, operatorId)

  res.status(204).send()
}

/**
 * Searches worksheets by keyword.
 * @param request
 * @param response
 * @returns {Promise<void>}
 */
async function searchWorksheets (request, response) {
  const repo = new LegacyWorksheetRepository()
  const worksheets = await repo.searchWorksheets(request.query)
  response.json(worksheets)
}

export const addOwnerToWorksheetController = wrap(addOwnerToWorksheet)
export const worksheetListController = wrap(worksheetList)
export const worksheetFindByIdController = wrap(findById)
export const getQueueController = worksheetQueueRepository => wrap(getQueue(worksheetQueueRepository))
export const queueListController = worksheetQueueRepository => wrap(queueList(worksheetQueueRepository))
export const actionsOnWorksheetQueueController = (worksheetQueueRepository, takeNextWorksheetService) => wrap(actionsOnWorksheetQueue(worksheetQueueRepository, takeNextWorksheetService))
export const queueTakenFindByOperatorController = worksheetQueueRepository => wrap(queueTakenFindByOperator(worksheetQueueRepository))
export const createQueueController = worksheetQueueRepository => wrap(createQueue(worksheetQueueRepository))
export const updateQueueController = worksheetQueueRepository => wrap(updateQueue(worksheetQueueRepository))
export const deleteQueueController = worksheetQueueRepository => wrap(deleteQueue(worksheetQueueRepository))
export const getScheduledWorksheetsController = worksheetQueueRepository => wrap(getScheduledWorksheets(worksheetQueueRepository))
export const removeScheduledWorksheetController = worksheetQueueRepository => wrap(removeScheduledWorksheet(worksheetQueueRepository))
export const searchWorksheetController = wrap(searchWorksheets)
