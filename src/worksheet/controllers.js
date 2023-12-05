import { wrap } from 'express-promise-wrap'
import _get from 'lodash/get'
import fromJSON from 'tcomb/lib/fromJSON'
import { History } from '../history/models'
import { canOperatorHandleQueue } from '../lib/role-operators'
import { UserRoles } from '../types/user'
import { WorksheetQueueBody } from './domain/queue'
import { setStatus } from './domain/worksheet'
import { LegacyWorksheetRepository } from './models/worksheet-repository'

async function worksheetList (req, res) {
  const repo = new LegacyWorksheetRepository()
  const worksheets = await repo.list(req.query)
  res.json(worksheets)
}

const updateWorksheetStatus = worksheetRepository => async (req, res) => {
  const worksheetId = req.params.id
  const worksheet = await worksheetRepository.get(worksheetId)
  const updatedWorksheet = setStatus(worksheet, req.body.status, req.body.reason)
  await worksheetRepository.save(updatedWorksheet)
  await History.registerUpdate({
    contextModel: updatedWorksheet,
    user: req.user
  })

  res.json(updatedWorksheet)
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
 * @param {Logger} logger
 */
const actionsOnWorksheetQueue = logger => async (req, res) => {
  logger.error('Actions on worksheet queue endpoint hit', { headers: req.headers })
  return res.status(400).send('Deprecated endpoint')
}

function operatorIdByPermissions (req) {
  const allowQuery = req.user.permissions.indexOf(UserRoles.MANAGER) !== -1
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

const getScheduledWorksheets = worksheetQueueRepository => async (req, res) => {
  const queueId = req.params.id
  const operatorId = req.user.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  const items = queue.findScheduledItemsByOperatorId(operatorId)
  res.json(items)
}

export const worksheetListController = wrap(worksheetList)
export const updateWorksheetStatusController = worksheetRepository => wrap(updateWorksheetStatus(worksheetRepository))
export const getQueueController = worksheetQueueRepository => wrap(getQueue(worksheetQueueRepository))
export const queueListController = worksheetQueueRepository => wrap(queueList(worksheetQueueRepository))
export const actionsOnWorksheetQueueController = logger => wrap(actionsOnWorksheetQueue(logger))
export const queueTakenFindByOperatorController = worksheetQueueRepository => wrap(queueTakenFindByOperator(worksheetQueueRepository))
export const createQueueController = worksheetQueueRepository => wrap(createQueue(worksheetQueueRepository))
export const updateQueueController = worksheetQueueRepository => wrap(updateQueue(worksheetQueueRepository))
export const deleteQueueController = worksheetQueueRepository => wrap(deleteQueue(worksheetQueueRepository))
export const getScheduledWorksheetsController = worksheetQueueRepository => wrap(getScheduledWorksheets(worksheetQueueRepository))
