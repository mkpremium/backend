import { worksheetRoutes } from './routes'
import buildingRoutes from './building/routes'

import './types'
import jwt from '../middleware/jwt'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'
import { setupEventListeners } from './event-listeners'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from './service/release-user-extra-opened-worksheets-in-queue.service'
import {asValue} from 'awilix'

/**
 * @param app
 * @param eventBus
 * @param {WorksheetQueueActionsService} worksheetQueueActionsService
 * @param {WorksheetRepository} worksheetRepository
 * @param {LegacyWorksheetRepository} legacyWorksheetRepository
 * @param {LegacyWorksheetQueueRepository} legacyWorksheetQueueRepository
 * @param {AwilixContainer} awilixContainer
 */
export default (app,
  { eventBus, couchbaseAdapter, worksheetRepository },
  { worksheetRepository: legacyWorksheetRepository, worksheetQueueRepository: legacyWorksheetQueueRepository },
  awilixContainer
) => {
  const secured = jwt()

  const worksheetQueueRepository = new WorksheetQueueRepository(couchbaseAdapter)
  const worksheetQueueActionsService = new WorksheetQueueActionsService(
    worksheetQueueRepository,
    worksheetRepository,
    eventBus
  )
  const takeNextWorksheetService = new TakeNextWorksheetService(
    worksheetQueueActionsService,
    worksheetRepository,
    worksheetQueueRepository
  )

  awilixContainer.register({
    takeNextWorksheetInQueueService: asValue(takeNextWorksheetService),
    worksheetQueueActionsService: asValue(worksheetQueueActionsService)
  })
  const releaseUserOtherActiveWorksheetsInQueueService = new ReleaseUserExtraOpenedWorksheetsInQueueService(
    worksheetQueueRepository,
    worksheetRepository,
    2
  )

  setupEventListeners(eventBus, {
    legacyWorksheetRepository,
    worksheetQueueActionsService,
    releaseUserOtherActiveWorksheetsInQueueService
  })

  app.use('/worksheets', secured,
    worksheetRoutes(legacyWorksheetQueueRepository, worksheetQueueActionsService, takeNextWorksheetService,
      worksheetRepository, eventBus))
  app.use('/worksheets/buildings', secured, buildingRoutes)
}
