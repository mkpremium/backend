import { aliasTo, asClass, asFunction, type AwilixContainer } from 'awilix'
import { createStatusChangedController } from './controller/status-changed.controller'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'
import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from './service/release-user-extra-opened-worksheets-in-queue.service'
import { UpdateWorksheetStatusOnOwnerChangeService } from './service/update-worksheet-status-on-owner-change.service'
import { PostgresWorksheetRepository } from './repository/postgres-worksheet.repository'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from './service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { CallcenterWorksheetService } from './service/callcenter-worksheet.service'
import { PostgresWorksheetQueueRepository } from './repository/postgres-worksheet-queue.repository'
import { FreezerService } from './service/freezer.service'
import { importWorksheetQueueHandlerFactory } from './service/import-worksheet-queue-command-handler.service'

export async function setupWorksheetDependencies (diContainer: AwilixContainer) {
  diContainer.register({
    worksheetStatusChangedController: asFunction(createStatusChangedController).singleton(),

    callcenterWorksheetService: asClass(CallcenterWorksheetService).classic().singleton(),
    freezerService: asClass(FreezerService).classic().singleton(),
    importWorksheetQueueHandler: asFunction(importWorksheetQueueHandlerFactory).singleton(),
    syncWorksheetStatusOnBuildingNegotiationStatusChangeService: asClass(
      SyncWorksheetStatusOnBuildingNegotiationStatusChangeService).singleton().classic(),
    worksheetQueueActionsService: asClass(WorksheetQueueActionsService).classic().singleton(),
    updateWorksheetStatusOnOwnerChangeService: asClass(UpdateWorksheetStatusOnOwnerChangeService).classic().singleton(),
    takeWorksheetService: aliasTo('worksheetQueueActionsService'),
    takeNextWorksheetService: asClass(TakeNextWorksheetService).classic().singleton(),
    releaseUserOtherActiveWorksheetsInQueueService: asClass(ReleaseUserExtraOpenedWorksheetsInQueueService).classic().singleton()
      .inject(() => ({ maxOpenedWorksheetPerQueueAndUser: 2 })),

    postgresWorksheetRepository: asClass(PostgresWorksheetRepository).classic().singleton(),
    worksheetRepository: aliasTo('postgresWorksheetRepository'),
    postgresQueueRepository: asClass(PostgresWorksheetQueueRepository).classic().singleton(),
    worksheetQueueRepository: aliasTo('postgresQueueRepository')
  })
}
