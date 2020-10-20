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

  router.get('/queues', permissions.manager, queueListController)

  router.post('/queues', permissions.manager, createQueueController)

  router.get('/queues/:id', getQueueController)

  router.get('/queues/:id/taken', queueTakenFindByOperatorController)

  router.post('/queues/:id', actionsOnWorksheetQueueController(worksheetQueueRepository))

  router.put('/queues/:id', permissions.manager, updateQueueController)

  router.delete('/queues/:id', permissions.manager, deleteQueueController)

  router.get('/queues/:id/scheduled', permissions.operator, getScheduledWorksheetsController)

  router.delete('/queues/:id/scheduled', permissions.operator, removeScheduledWorksheetController)

  router.get('/search', searchWorksheetController)

  router.get('/:id', worksheetFindByIdController)

  router.post('/:id/owners', addOwnerToWorksheetController)

  return router
}
