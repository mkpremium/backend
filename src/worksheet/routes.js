import { Router } from 'express'
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
  getScheduledWorksheetsController, removeScheduledWorksheetController, searchWorksheetController
} from './controllers'
import { permissions } from '../middleware/jwt'

export function worksheetRoutes (worksheetQueueRepository) {
  const router = Router()

  router.get('/', worksheetListController)

  router.get('/queues', permissions.manager, queueListController(worksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(worksheetQueueRepository))

  router.get('/queues/:id', getQueueController(worksheetQueueRepository))

  router.get('/queues/:id/taken', queueTakenFindByOperatorController(worksheetQueueRepository))

  router.post('/queues/:id', actionsOnWorksheetQueueController(worksheetQueueRepository))

  router.put('/queues/:id', permissions.manager, updateQueueController(worksheetQueueRepository))

  router.delete('/queues/:id', permissions.manager, deleteQueueController(worksheetQueueRepository))

  router.get('/queues/:id/scheduled', permissions.operator, getScheduledWorksheetsController(worksheetQueueRepository))

  router.delete('/queues/:id/scheduled', permissions.operator, removeScheduledWorksheetController(worksheetQueueRepository))

  router.get('/search', searchWorksheetController)

  router.get('/:id', worksheetFindByIdController)

  router.post('/:id/owners', addOwnerToWorksheetController)

  return router
}
