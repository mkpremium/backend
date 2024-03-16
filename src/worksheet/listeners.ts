import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { BuildingNegotiationStatusChanged } from '../building/service/update-building-negotiation-status.service'
import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from './service/release-user-extra-opened-worksheets-in-queue.service'
import { Logger } from 'winston'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from './service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { subscribeToCommand } from '../infrastructure/listeners'

export function worksheetEventListeners (eventBus: EventListener, container: AwilixContainer) {
  const syncWorksheetStatusOnBuildingNegotiationStatusChangeService = container.resolve('syncWorksheetStatusOnBuildingNegotiationStatusChangeService') as SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
  const releaseUserOtherActiveWorksheetsInQueueService = container.resolve('releaseUserOtherActiveWorksheetsInQueueService') as ReleaseUserExtraOpenedWorksheetsInQueueService
  const logger = container.resolve('logger') as Logger

  eventBus.on(
    DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
    'worksheet.update_status',
    async (evt: BuildingNegotiationStatusChanged) => {
      logger.info('updating worksheet because building negotiation status changed', evt)
      await syncWorksheetStatusOnBuildingNegotiationStatusChangeService.updateWorksheet(evt)
    })

  eventBus.on(
    DomainEventCatalog.WORKSHEET__TAKEN,
    'worksheet.release_caller_extra_worksheets',
    async ({ queueId, by }) => {
      await releaseUserOtherActiveWorksheetsInQueueService.release(by, queueId)
    })

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES_MIGRATION__IMPORT_WORKSHEET_QUEUE,
    'importWorksheetQueueHandler',
    container
  )
}
