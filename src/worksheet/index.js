import { worksheetRoutes } from './routes'
import buildingRoutes from './building/routes'

import './types'
import jwt from '../middleware/jwt'
import { logger } from '../infrastructure/logger'
import { SCHEDULED_EVENT_DELETED } from '../scheduled-events/controllers'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/UpdateBuildingNegotiationStatusService'

/**
 * @param app
 * @param eventBus
 * @param {WorksheetQueueActionsService} worksheetQueueActionsService
 * @param {WorksheetRepository} worksheetRepository
 * @param worksheetQueueRepository
 */
export default (app,
  { eventBus, worksheetQueueActionsService },
  { worksheetRepository, worksheetQueueRepository }
) => {
  const secured = jwt()

  eventBus
    .on(BUILDING_NEGOTIATION_STATUS_CHANGED, async ({ buildingId, operatorId }) => {
      logger.info('updating worksheet because building negotiation status changed', { buildingId, operatorId })
      try {
        const worksheet = await worksheetRepository.findWorksheetByBuilding(buildingId)
        await worksheetRepository.updateStatus(worksheet.id, operatorId)
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

  app.use('/worksheets', secured, worksheetRoutes(worksheetQueueRepository, worksheetQueueActionsService))
  app.use('/worksheets/buildings', secured, buildingRoutes)
}
