import { aliasTo, asClass, asFunction } from 'awilix'
import jwt from '../middleware/jwt'
import buildingRoutes from './building/routes'
import { createStatusChangedController } from './controller/status-changed.controller'
import { setupEventListeners } from './event-listeners'
import { LegacyWorksheetQueueRepository } from './models/queue-repository'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { WorksheetRepository } from './repository/worksheet.repository'
import { worksheetRoutes } from './routes'
import { ReleaseUserExtraOpenedWorksheetsInQueueService }
  from './service/release-user-extra-opened-worksheets-in-queue.service'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import './types'

export const setupWorksheetDependencies = diContainer => {
  diContainer.register({
    worksheetStatusChangedController: asFunction(createStatusChangedController).singleton(),

    worksheetQueueActionsService: asClass(WorksheetQueueActionsService).classic().singleton(),
    takeWorksheetService: aliasTo('worksheetQueueActionsService'),
    takeNextWorksheetService: asClass(TakeNextWorksheetService).classic().singleton(),
    releaseUserOtherActiveWorksheetsInQueueService: asClass(ReleaseUserExtraOpenedWorksheetsInQueueService).classic().singleton()
      .inject(() => ({ maxOpenedWorksheetPerQueueAndUser: 2 })),

    worksheetRepository: asClass(WorksheetRepository).classic().singleton(),
    worksheetQueueRepository: asClass(WorksheetQueueRepository).classic().singleton(),
    legacyWorksheetRepository: asClass(LegacyWorksheetRepository).classic().singleton(),
    legacyWorksheetQueueRepository: asClass(LegacyWorksheetQueueRepository).classic().singleton()
  })
}

/**
 * @param app
 * @param {AwilixContainer} awilixContainer
 */
export const setupWorksheetRoutesAndEventListeners = (app, awilixContainer) => {
  const secured = jwt()

  setupEventListeners(awilixContainer.resolve('eventBus'), {
    legacyWorksheetRepository: awilixContainer.resolve('legacyWorksheetRepository'),
    worksheetQueueActionsService: awilixContainer.resolve('worksheetQueueActionsService'),
    releaseUserOtherActiveWorksheetsInQueueService: awilixContainer.resolve('releaseUserOtherActiveWorksheetsInQueueService')
  })

  app.use('/worksheets', secured, worksheetRoutes(awilixContainer))
  app.use('/worksheets/buildings', secured, buildingRoutes)
}
