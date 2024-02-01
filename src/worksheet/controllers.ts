import { wrap } from 'express-promise-wrap'
import fromJSON from 'tcomb/lib/fromJSON'
import { WorksheetQueueBody } from './domain/queue'
import type { LegacyWorksheetRepository } from './models/worksheet-repository'
import type { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import t from 'tcomb'

export function worksheetListControllerFactory (legacyWorksheetRepository: LegacyWorksheetRepository) {
  async function worksheetListController (req, res) {
    const worksheets = await legacyWorksheetRepository.list(req.query)
    res.json(worksheets)
  }

  return wrap(worksheetListController)
}

export function createQueueControllerFactory (worksheetQueueRepository: WorksheetQueueRepository) {
  async function createQueueController (req, res) {
    const params = fromJSON(req.body, WorksheetQueueBody)
    const queue = await worksheetQueueRepository.save(params)
    res.status(201).json(queue)
  }

  return wrap(createQueueController)
}

export function updateQueueControllerFactory (worksheetQueueRepository: WorksheetQueueRepository) {
  async function updateQueueController (req, res) {
    const queueId = req.params.id
    const queue = await worksheetQueueRepository.get(queueId)
    const $merge = fromJSON(req.body, WorksheetQueueBody)
    const updatedQueue = await worksheetQueueRepository.save(t.update(queue, { $merge }))
    res.json(updatedQueue)
  }

  return wrap(updateQueueController)
}

export function queueListControllerFactory (worksheetQueueRepository: WorksheetQueueRepository) {
  async function queueListController (req, res) {
    const queues = await worksheetQueueRepository.list()
    res.json(queues)
  }

  return wrap(queueListController)
}
