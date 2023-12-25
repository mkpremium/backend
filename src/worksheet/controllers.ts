import { wrap } from 'express-promise-wrap'
import fromJSON from 'tcomb/lib/fromJSON'
import { History } from '../history/models'
import { WorksheetQueueBody } from './domain/queue'
import { setStatus } from './domain/worksheet'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { WorksheetRepository } from './repository/worksheet.repository'
import t from 'tcomb'

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

const createQueue = (worksheetQueueRepository: WorksheetQueueRepository) => async (req, res) => {
  const params = fromJSON(req.body, WorksheetQueueBody)
  const queue = await worksheetQueueRepository.save(params)
  await History.registerCreate({
    contextModel: queue,
    user: req.user
  })
  res.status(201).json(queue)
}

const updateQueue = (worksheetQueueRepository: WorksheetQueueRepository) => async (req, res) => {
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.get(queueId)
  const $merge = fromJSON(req.body, WorksheetQueueBody)
  const updatedQueue = await worksheetQueueRepository.save(t.update(queue, { $merge }))
  await History.registerUpdate({
    contextModel: updatedQueue,
    user: req.user
  })
  res.json(updatedQueue)
}

const queueList = (worksheetQueueRepository: WorksheetQueueRepository) => async (req, res) => {
  const queues = await worksheetQueueRepository.list()
  res.json(queues)
}

export const worksheetListController = wrap(worksheetList)
export const updateWorksheetStatusController = (worksheetRepository: WorksheetRepository) => wrap(updateWorksheetStatus(worksheetRepository))
export const queueListController = (worksheetQueueRepository: WorksheetQueueRepository) => wrap(queueList(worksheetQueueRepository))
export const createQueueController = (worksheetQueueRepository: WorksheetQueueRepository) => wrap(createQueue(worksheetQueueRepository))
export const updateQueueController = (worksheetQueueRepository: WorksheetQueueRepository) => wrap(updateQueue(worksheetQueueRepository))
