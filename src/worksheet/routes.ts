import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { createTakeWorksheetIntoQueueController } from './controller/take-worksheet.controller'
import {
  createQueueController,
  deleteQueueController,
  queueListController,
  updateQueueController,
  updateWorksheetStatusController,
  worksheetListController
} from './controllers'
import { AwilixContainer } from 'awilix'
import { createStatusChangedController } from './controller/status-changed.controller'
import type { LegacyWorksheetQueueRepository } from './models/queue-repository'

export function worksheetRoutes (container: AwilixContainer) {
  const router = Router()

  router.get('/', worksheetListController)

  const legacyWorksheetQueueRepository = container.resolve('legacyWorksheetQueueRepository') as LegacyWorksheetQueueRepository
  router.get('/queues', permissions.manager, queueListController(legacyWorksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(legacyWorksheetQueueRepository))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(container.resolve('worksheetQueueActionsService'))
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(legacyWorksheetQueueRepository))

  router.delete('/queues/:id', permissions.manager, deleteQueueController(legacyWorksheetQueueRepository))

  router.put('/:id/status', updateWorksheetStatusController(container.resolve('worksheetRepository')))

  router.post('/status-changed', wrap(
    container.resolve('worksheetStatusChangedController') as ReturnType<typeof createStatusChangedController>
  ))

  return router
}
