import { AwilixContainer } from 'awilix'
import { Express, Router } from 'express'
import {
  createQueueController,
  queueListController,
  updateQueueController,
  worksheetListController
} from './controllers'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { permissions } from '../middleware/jwt'
import { wrap } from 'express-promise-wrap'
import { createTakeWorksheetIntoQueueController } from './controller/take-worksheet.controller'
import { createStatusChangedController } from './controller/status-changed.controller'

export const worksheetsRoutes = (app: Express, container: AwilixContainer, secured) => {
  const router = Router()

  router.get('/', worksheetListController)

  const worksheetQueueRepository = container.resolve('worksheetQueueRepository') as WorksheetQueueRepository
  router.get('/queues', permissions.manager, queueListController(worksheetQueueRepository))

  router.post('/queues', permissions.manager, createQueueController(worksheetQueueRepository))

  router.post('/queues/:queueId/worksheets/:worksheetId', permissions.operator, wrap(
    createTakeWorksheetIntoQueueController(container.resolve('worksheetQueueActionsService'))
  ))

  router.put('/queues/:id', permissions.manager, updateQueueController(worksheetQueueRepository))

  router.post('/status-changed', wrap(
    container.resolve('worksheetStatusChangedController') as ReturnType<typeof createStatusChangedController>
  ))

  app.use('/worksheets', secured, router)
}
