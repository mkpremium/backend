import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { logger } from '../infrastructure/logger'
import { SCHEDULED_EVENT_DELETED } from '../scheduled-events/controllers'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import {
  BUILDING_NEGOTIATION_STATUS_CHANGED,
  BuildingNegotiationStatusChanged
} from '../building/service/update-building-negotiation-status.service'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from './service/release-user-extra-opened-worksheets-in-queue.service'
import { UpdateWorksheetStatusOnOwnerChangeService } from './service/update-worksheet-status-on-owner-change.service'
import { OwnerStatusChangedEvent } from '../owner/service/change-contact-status.service'

export function worksheetEventListeners (container: AwilixContainer) {
  const eventBus = container.resolve('eventBus') as EventBus
  const legacyWorksheetRepository = container.resolve('legacyWorksheetRepository') as LegacyWorksheetRepository
  const worksheetQueueActionsService = container.resolve('worksheetQueueActionsService') as WorksheetQueueActionsService
  const releaseUserOtherActiveWorksheetsInQueueService = container.resolve('releaseUserOtherActiveWorksheetsInQueueService') as ReleaseUserExtraOpenedWorksheetsInQueueService
  const updateWorksheetStatusOnOwnerChangeService = container.resolve('updateWorksheetStatusOnOwnerChangeService') as UpdateWorksheetStatusOnOwnerChangeService

  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, async ({
                                                            buildingId,
                                                            userId
                                                          }: BuildingNegotiationStatusChanged) => {
    logger.info('updating worksheet because building negotiation status changed', { buildingId, userId })
    try {
      const worksheet = await legacyWorksheetRepository.findWorksheetByBuilding(buildingId)
      await legacyWorksheetRepository.updateStatus(worksheet.id, userId)
    } catch (error) {
      logger.crit('could not update worksheet on building status change', { error, errorMessage: error.message })
    }
  })

  eventBus.on(SCHEDULED_EVENT_DELETED, async ({ id }) => {
    worksheetQueueActionsService.removeScheduledCallFromWorksheets(id)
      .then(() => {
        logger.info('scheduled call removed from worksheet successfully')
      })
      .catch(error => {
        logger.crit('error removing scheduled call from worksheets', { scheduledCallId: id, error })
      })
  })

  eventBus.on('worksheet.taken', async ({ queueId, by }) => {
    await releaseUserOtherActiveWorksheetsInQueueService.release(by, queueId)
  })

  eventBus.on('owner.status_changed', (evt: OwnerStatusChangedEvent) => {
    return updateWorksheetStatusOnOwnerChangeService.updateWorksheet(evt)
  })
}
