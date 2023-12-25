import { wrap } from 'express-promise-wrap'
import fromJSON from 'tcomb/lib/fromJSON'
import { History } from '../history/models'
import { UserRoles } from '../types/user'
import { WorksheetQueueBody } from './domain/queue'
import { setStatus } from './domain/worksheet'
import { LegacyWorksheetQueueRepository } from './models/legacy-worksheet-queue.repository'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { WorksheetRepository } from './repository/worksheet.repository'

async function worksheetList (req, res) {
  const repo = new LegacyWorksheetRepository()
  const worksheets = await repo.list(req.query)
  res.json(worksheets)
}

const updateWorksheetStatus = (worksheetRepository: WorksheetRepository) => async (req, res) => {
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

const createQueue = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => async (req, res) => {
  const params = fromJSON(req.body, WorksheetQueueBody)
  const queue = await worksheetQueueRepository.save(params)
  await History.registerCreate({
    contextModel: queue,
    user: req.user
  })
  res.status(201).json(queue)
}

const updateQueue = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => async (req, res) => {
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  const updatedQueue = await worksheetQueueRepository.update(queue, req.body)
  await History.registerUpdate({
    contextModel: updatedQueue,
    user: req.user
  })
  res.json(updatedQueue)
}

const deleteQueue = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => async (req, res) => {
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.findByIdOrThrow(queueId)
  await worksheetQueueRepository.deleteQueue(queue)
  await History.registerDelete({
    contextModel: queue,
    user: req.user
  })
  res.status(204).send()
}

const queueList = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => async (req, res) => {
  const queues = await worksheetQueueRepository.list(req.query)
  res.json(queues)
}

function operatorIdByPermissions (req) {
  const allowQuery = req.user.permissions.indexOf(UserRoles.MANAGER) !== -1
  return allowQuery
    ? req.query.operationId || req.user.id
    : req.user.id
}

export const worksheetListController = wrap(worksheetList)
export const updateWorksheetStatusController = (worksheetRepository: WorksheetRepository) => wrap(updateWorksheetStatus(worksheetRepository))
export const queueListController = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => wrap(queueList(worksheetQueueRepository))
export const createQueueController = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => wrap(createQueue(worksheetQueueRepository))
export const updateQueueController = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => wrap(updateQueue(worksheetQueueRepository))
export const deleteQueueController = (worksheetQueueRepository: LegacyWorksheetQueueRepository) => wrap(deleteQueue(worksheetQueueRepository))
