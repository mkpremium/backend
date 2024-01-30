import { wrap } from 'express-promise-wrap'
import fromJSON from 'tcomb/lib/fromJSON'
import { WorksheetQueueBody } from './domain/queue'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import t from 'tcomb'

async function worksheetList (req, res) {
  const repo = new LegacyWorksheetRepository()
  const worksheets = await repo.list(req.query)
  res.json(worksheets)
}

const createQueue = (worksheetQueueRepository: WorksheetQueueRepository) => async (req, res) => {
  const params = fromJSON(req.body, WorksheetQueueBody)
  const queue = await worksheetQueueRepository.save(params)
  res.status(201).json(queue)
}

const updateQueue = (worksheetQueueRepository: WorksheetQueueRepository) => async (req, res) => {
  const queueId = req.params.id
  const queue = await worksheetQueueRepository.get(queueId)
  const $merge = fromJSON(req.body, WorksheetQueueBody)
  const updatedQueue = await worksheetQueueRepository.save(t.update(queue, { $merge }))
  res.json(updatedQueue)
}

const queueList = (worksheetQueueRepository: WorksheetQueueRepository) => async (req, res) => {
  const queues = await worksheetQueueRepository.list()
  res.json(queues)
}

export const worksheetListController = wrap(worksheetList)
export const queueListController = (worksheetQueueRepository: WorksheetQueueRepository) => wrap(queueList(worksheetQueueRepository))
export const createQueueController = (worksheetQueueRepository: WorksheetQueueRepository) => wrap(createQueue(worksheetQueueRepository))
export const updateQueueController = (worksheetQueueRepository: WorksheetQueueRepository) => wrap(updateQueue(worksheetQueueRepository))
