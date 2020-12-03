import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import {
  worksheetFindByIdController,
  worksheetListController,
  queueListController,
  actionsOnWorksheetQueueController,
  queueTakenFindByOperatorController,
  addOwnerToWorksheetController,
  getQueueController,
  createQueueController,
  updateQueueController,
  deleteQueueController,
  getScheduledWorksheetsController,
  searchWorksheetController
} from './controllers'
import { permissions } from '../middleware/jwt'
import { createTakeWorksheetIntoQueueController } from './controller/take-worksheet.controller'

export function worksheetRoutes (worksheetQueueRepository, worksheetQueueActionsService, takeNextWorksheetService) {
  const router = Router()

  router.get('/', worksheetListController)

  router.get('/queues', permissions.manager, queueListController(worksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(worksheetQueueRepository))

  router.get('/queues/:id', getQueueController(worksheetQueueRepository))

  router.get('/queues/:id/taken', queueTakenFindByOperatorController(worksheetQueueRepository))

  router.post('/queues/:id', actionsOnWorksheetQueueController(worksheetQueueRepository, takeNextWorksheetService))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(worksheetQueueActionsService)
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(worksheetQueueRepository))

  router.delete('/queues/:id', permissions.manager, deleteQueueController(worksheetQueueRepository))

  router.get('/queues/:id/scheduled', permissions.operator, getScheduledWorksheetsController(worksheetQueueRepository))

  router.get('/search', searchWorksheetController)

  router.get('/:id', worksheetFindByIdController)

  router.post('/:id/owners', addOwnerToWorksheetController)

  return router
}
