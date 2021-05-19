import { aliasTo, asClass, asFunction } from 'awilix'
import { createStatusChangedController } from './controller/status-changed.controller'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from './service/release-user-extra-opened-worksheets-in-queue.service'
import { WorksheetRepository } from './repository/worksheet.repository'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { LegacyWorksheetQueueRepository } from './models/queue-repository'

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
