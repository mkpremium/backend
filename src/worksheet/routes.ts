import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { createTakeWorksheetIntoQueueController } from './controller/take-worksheet.controller'
import {
  actionsOnWorksheetQueueController,
  createQueueController,
  deleteQueueController,
  getScheduledWorksheetsController,
  queueListController,
  queueTakenFindByOperatorController,
  updateQueueController,
  updateWorksheetStatusController,
  worksheetListController
} from './controllers'
import { AwilixContainer } from 'awilix'

export function worksheetRoutes (container: AwilixContainer) {
  const router = Router()

  router.get('/', worksheetListController)

  const legacyWorksheetQueueRepository = container.resolve('legacyWorksheetQueueRepository')
  router.get('/queues', permissions.manager, queueListController(legacyWorksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id/taken', queueTakenFindByOperatorController(legacyWorksheetQueueRepository))

  router.post('/queues/:id', actionsOnWorksheetQueueController(container.resolve('logger')))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(container.resolve('worksheetQueueActionsService'))
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(legacyWorksheetQueueRepository))

  router.delete('/queues/:id', permissions.manager, deleteQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id/scheduled', permissions.operator, getScheduledWorksheetsController(legacyWorksheetQueueRepository))

  router.put('/:id/status', updateWorksheetStatusController(container.resolve('worksheetRepository')))

  router.post('/status-changed', wrap(container.resolve('worksheetStatusChangedController')))

  return router
}
