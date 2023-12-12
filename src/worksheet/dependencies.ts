import { aliasTo, asClass, asFunction } from 'awilix'
import { createStatusChangedController } from './controller/status-changed.controller'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'
import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from './service/release-user-extra-opened-worksheets-in-queue.service'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { LegacyWorksheetQueueRepository } from './models/queue-repository'
import { UpdateWorksheetStatusOnOwnerChangeService } from './service/update-worksheet-status-on-owner-change.service'
import { CouchbaseWorksheetRepository } from './repository/couchbase-worksheet.repository'
import { PostgresWorksheetRepository } from './repository/postgres-worksheet.repository'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from './service/sync-worksheet-status-on-building-negotiation-status-change.service'

export const setupWorksheetDependencies = (diContainer, usePostgres: boolean) => {
  diContainer.register({
    worksheetStatusChangedController: asFunction(createStatusChangedController).singleton(),

    syncWorksheetStatusOnBuildingNegotiationStatusChangeService: asClass(
      SyncWorksheetStatusOnBuildingNegotiationStatusChangeService).singleton().classic(),
    worksheetQueueActionsService: asClass(WorksheetQueueActionsService).classic().singleton(),
    updateWorksheetStatusOnOwnerChangeService: asClass(UpdateWorksheetStatusOnOwnerChangeService).classic().singleton(),
    takeWorksheetService: aliasTo('worksheetQueueActionsService'),
    takeNextWorksheetService: asClass(TakeNextWorksheetService).classic().singleton(),
    releaseUserOtherActiveWorksheetsInQueueService: asClass(ReleaseUserExtraOpenedWorksheetsInQueueService).classic().singleton()
      .inject(() => ({ maxOpenedWorksheetPerQueueAndUser: 2 })),

    couchbaseWorksheetRepository: asClass(CouchbaseWorksheetRepository).classic().singleton(),
    postgresWorksheetRepository: asClass(PostgresWorksheetRepository).classic().singleton(),
    worksheetRepository: aliasTo(usePostgres ? 'postgresWorksheetRepository' : 'couchbaseWorksheetRepository'),
    worksheetQueueRepository: asClass(WorksheetQueueRepository).classic().singleton(),
    legacyWorksheetRepository: asClass(LegacyWorksheetRepository).classic().singleton(),
    legacyWorksheetQueueRepository: asClass(LegacyWorksheetQueueRepository).classic().singleton()
  })
}
