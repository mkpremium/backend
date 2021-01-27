import { worksheetRoutes } from './routes'
import buildingRoutes from './building/routes'

import './types'
import jwt from '../middleware/jwt'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'
import { setupEventListeners } from './event-listeners'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from './service/release-user-extra-opened-worksheets-in-queue.service'
import { aliasTo, asClass } from 'awilix'
import { LegacyWorksheetQueueRepository } from './models/queue-repository'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { WorksheetRepository } from './repository/worksheet.repository'

export const setupWorksheetDependencies = awilixContainer => {
  awilixContainer.register({
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
