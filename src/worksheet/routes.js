import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { createTakeWorksheetIntoQueueController } from './controller/take-worksheet.controller'
import {
  actionsOnWorksheetQueueController,
  createQueueController,
  deleteQueueController,
  getQueueController,
  getScheduledWorksheetsController,
  queueListController,
  queueTakenFindByOperatorController,
  updateQueueController,
  updateWorksheetStatusController,
  worksheetFindByIdController,
  worksheetListController
} from './controllers'

export function worksheetRoutes (awilixContainer) {
  const router = Router()

  router.get('/', worksheetListController)

  const legacyWorksheetQueueRepository = awilixContainer.resolve('legacyWorksheetQueueRepository')
  router.get('/queues', permissions.manager, queueListController(legacyWorksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id', getQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id/taken', queueTakenFindByOperatorController(legacyWorksheetQueueRepository))

  router.post('/queues/:id', actionsOnWorksheetQueueController(awilixContainer.resolve('logger')))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(awilixContainer.resolve('worksheetQueueActionsService'))
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(legacyWorksheetQueueRepository))

  router.delete('/queues/:id', permissions.manager, deleteQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id/scheduled', permissions.operator, getScheduledWorksheetsController(legacyWorksheetQueueRepository))

  router.get('/:id', worksheetFindByIdController)

  router.put('/:id/status', updateWorksheetStatusController(awilixContainer.resolve('worksheetRepository')))

  router.post('/status-changed', awilixContainer.resolve('worksheetStatusChangedController'))

  return router
}
