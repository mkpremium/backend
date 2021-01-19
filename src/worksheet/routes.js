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
import { createMakeAlreadySoldWorksheetAvailable } from './controller/make-already-sold-worksheets-available'

export function worksheetRoutes (awilixContainer) {
  const router = Router()

  router.get('/', worksheetListController)

  const legacyWorksheetQueueRepository = awilixContainer.resolve('legacyWorksheetQueueRepository')
  router.get('/queues', permissions.manager, queueListController(legacyWorksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id', getQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id/taken', queueTakenFindByOperatorController(legacyWorksheetQueueRepository))

  router.post('/queues/:id', actionsOnWorksheetQueueController(legacyWorksheetQueueRepository, awilixContainer.resolve('takeNextWorksheetService')))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(awilixContainer.resolve('worksheetQueueActionsService'))
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(legacyWorksheetQueueRepository))

  router.delete('/queues/:id', permissions.manager, deleteQueueController(legacyWorksheetQueueRepository))

  router.get('/queues/:id/scheduled', permissions.operator, getScheduledWorksheetsController(legacyWorksheetQueueRepository))

  router.get('/search', searchWorksheetController)

  router.get('/:id', worksheetFindByIdController)

  router.post('/:id/owners', addOwnerToWorksheetController)

  router.post('/republish-already-sold', permissions.admin,
    createMakeAlreadySoldWorksheetAvailable(
      awilixContainer.resolve('worksheetRepository'),
      awilixContainer.resolve('eventBus')
    ))

  return router
}
