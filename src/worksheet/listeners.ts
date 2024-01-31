import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { BuildingNegotiationStatusChanged } from '../building/service/update-building-negotiation-status.service'
import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from './service/release-user-extra-opened-worksheets-in-queue.service'
import { UpdateWorksheetStatusOnOwnerChangeService } from './service/update-worksheet-status-on-owner-change.service'
import { OwnerStatusChangedEvent } from '../owner/service/change-contact-status.service'
import { InvalidWorksheetFound } from './service/take-next-worksheet.service'
import { WorksheetRepository } from './repository/worksheet.repository'
import { Logger } from 'winston'
import { setStatus } from './domain/worksheet'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from './service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { subscribeToCommand } from '../infrastructure/listeners'

export function worksheetEventListeners (eventBus: EventListener, container: AwilixContainer) {
  const worksheetRepository = container.resolve('worksheetRepository') as WorksheetRepository
  const syncWorksheetStatusOnBuildingNegotiationStatusChangeService = container.resolve('syncWorksheetStatusOnBuildingNegotiationStatusChangeService') as SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
  const worksheetQueueActionsService = container.resolve('worksheetQueueActionsService') as WorksheetQueueActionsService
  const releaseUserOtherActiveWorksheetsInQueueService = container.resolve('releaseUserOtherActiveWorksheetsInQueueService') as ReleaseUserExtraOpenedWorksheetsInQueueService
  const updateWorksheetStatusOnOwnerChangeService = container.resolve('updateWorksheetStatusOnOwnerChangeService') as UpdateWorksheetStatusOnOwnerChangeService
  const logger = container.resolve('logger') as Logger
  const consistencyDelay = container.resolve('consistencyDelay') as number

  eventBus.on(
    DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
    'worksheet.update_status',
    async (evt: BuildingNegotiationStatusChanged) => {
      logger.info('updating worksheet because building negotiation status changed', evt)
      await syncWorksheetStatusOnBuildingNegotiationStatusChangeService.updateWorksheet(evt)
    })

  eventBus.on(
    DomainEventCatalog.SCHEDULED_EVENTS__EVENT_DELETED,
    'worksheet.remove_scheduled_call',
    async ({ id }) => {
      worksheetQueueActionsService.removeScheduledCallFromWorksheets(id)
        .then(() => {
          logger.info('scheduled call removed from worksheet successfully')
        })
        .catch(error => {
          logger.crit('error removing scheduled call from worksheets', { scheduledCallId: id, error })
        })
    })

  eventBus.on(
    DomainEventCatalog.WORKSHEET__TAKEN,
    'worksheet.release_caller_extra_worksheets',
    async ({ queueId, by }) => {
      await releaseUserOtherActiveWorksheetsInQueueService.release(by, queueId)
    })

  eventBus.on(
    DomainEventCatalog.WORKSHEET__INVALID_WORKSHEET_FOUND,
    'worksheet.invalidate_worksheet',
    invalidateWorksheet
  )

  eventBus.on(
    'virtual-caller.worksheet_not_found',
    'worksheet.invalidate_worksheet',
    invalidateWorksheet
  )

  eventBus.on(
    DomainEventCatalog.OWNER__STATUS_CHANGED,
    'worksheet.update_status',
    (evt: OwnerStatusChangedEvent) => {
      return new Promise(resolve => setTimeout(resolve, consistencyDelay))
        .then(() => updateWorksheetStatusOnOwnerChangeService.updateWorksheet(evt))
    })

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES_MIGRATION__IMPORT_WORKSHEET_QUEUE,
    'importWorksheetQueueHandler',
    container
  )

  async function invalidateWorksheet ({ worksheetId }: InvalidWorksheetFound) {
    logger.info('Invalid worksheet found, updating status', { worksheetId })
    const worksheet = await worksheetRepository.get(worksheetId)
    const updatedWorksheet = setStatus(worksheet, 'INVALID')

    await worksheetRepository.save(updatedWorksheet)
  }
}
