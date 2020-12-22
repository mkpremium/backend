import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'
import { logger } from '../infrastructure/logger'
import { SCHEDULED_EVENT_DELETED } from '../scheduled-events/controllers'

export function setupEventListeners (
  eventBus,
  { legacyWorksheetRepository, worksheetQueueActionsService, releaseUserOtherActiveWorksheetsInQueueService }
) {
  eventBus
    .on(BUILDING_NEGOTIATION_STATUS_CHANGED, async ({ buildingId, operatorId }) => {
      logger.info('updating worksheet because building negotiation status changed', { buildingId, operatorId })
      try {
        const worksheet = await legacyWorksheetRepository.findWorksheetByBuilding(buildingId)
        await legacyWorksheetRepository.updateStatus(worksheet.id, operatorId)
      } catch (error) {
        logger.crit('could not update worksheet on building status change', { error })
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
    .on('worksheet.taken', async ({ worksheetId, queueId, by }) => {
      await releaseUserOtherActiveWorksheetsInQueueService.release(by, queueId, worksheetId)
    })
}
