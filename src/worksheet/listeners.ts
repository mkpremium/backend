import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { logger } from '../infrastructure/logger'
import { SCHEDULED_EVENT_DELETED } from '../scheduled-events/controllers'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from './service/release-user-extra-opened-worksheets-in-queue.service'

export function worksheetEventListeners (container: AwilixContainer) {
  const eventBus = container.resolve('eventBus') as EventBus
  const legacyWorksheetRepository = container.resolve('legacyWorksheetRepository') as LegacyWorksheetRepository
  const worksheetQueueActionsService = container.resolve('worksheetQueueActionsService') as WorksheetQueueActionsService
  const releaseUserOtherActiveWorksheetsInQueueService = container.resolve('releaseUserOtherActiveWorksheetsInQueueService') as ReleaseUserExtraOpenedWorksheetsInQueueService

  eventBus
    .on(BUILDING_NEGOTIATION_STATUS_CHANGED, async ({ buildingId, operatorId }) => {
      logger.info('updating worksheet because building negotiation status changed', { buildingId, operatorId })
      try {
        const worksheet = await legacyWorksheetRepository.findWorksheetByBuilding(buildingId)
        await legacyWorksheetRepository.updateStatus(worksheet.id, operatorId)
      } catch (error) {
        logger.crit('could not update worksheet on building status change', { error, errorMessage: error.message })
      }
    })

  eventBus
    .on(SCHEDULED_EVENT_DELETED, async ({ id }) => {
      worksheetQueueActionsService.removeScheduledCallFromWorksheets(id)
        .then(() => {
          logger.info('scheduled call removed from worksheet successfully')
        })
        .catch(error => {
          logger.crit('error removing scheduled call from worksheets', { scheduledCallId: id, error })
        })
    })

  eventBus
    .on('worksheet.taken', async ({ queueId, by }) => {
      await releaseUserOtherActiveWorksheetsInQueueService.release(by, queueId)
    })
}
