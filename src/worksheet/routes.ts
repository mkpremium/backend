import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { createTakeWorksheetIntoQueueController } from './controller/take-worksheet.controller'
import {
  createQueueController,
  queueListController,
  updateQueueController,
  updateWorksheetStatusController,
  worksheetListController
} from './controllers'
import { AwilixContainer } from 'awilix'
import { createStatusChangedController } from './controller/status-changed.controller'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'

export function worksheetRoutes (container: AwilixContainer) {
  const router = Router()

  router.get('/', worksheetListController)

  const worksheetQueueRepository = container.resolve('worksheetQueueRepository') as WorksheetQueueRepository
  router.get('/queues', permissions.manager, queueListController(worksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(worksheetQueueRepository))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(container.resolve('worksheetQueueActionsService'))
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(worksheetQueueRepository))

  router.put('/:id/status', updateWorksheetStatusController(container.resolve('worksheetRepository')))

  router.post('/status-changed', wrap(
    container.resolve('worksheetStatusChangedController') as ReturnType<typeof createStatusChangedController>
  ))

  return router
}
