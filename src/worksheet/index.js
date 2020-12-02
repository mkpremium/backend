import { worksheetRoutes } from './routes'
import buildingRoutes from './building/routes'

import './types'
import jwt from '../middleware/jwt'
import { logger } from '../infrastructure/logger'
import { SCHEDULED_EVENT_DELETED } from '../scheduled-events/controllers'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/UpdateBuildingNegotiationStatusService'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import { WorksheetQueueRepository } from './repository/worksheet-queue.repository'
import { TakeNextWorksheetService } from './service/take-next-worksheet.service'

/**
 * @param app
 * @param eventBus
 * @param {WorksheetQueueActionsService} worksheetQueueActionsService
 * @param {WorksheetRepository} worksheetRepository
 */
export default (app,
  { eventBus, couchbaseAdapter, worksheetRepository },
  { worksheetRepository: legacyWorksheetRepository, worksheetQueueRepository: legacyWorksheetQueueRepository }
) => {
  const secured = jwt()

  const worksheetQueueRepository = new WorksheetQueueRepository(couchbaseAdapter)
  const worksheetQueueActionsService = new WorksheetQueueActionsService(
    worksheetQueueRepository,
    worksheetRepository,
    eventBus
  )
  const takeNextWorksheetService = new TakeNextWorksheetService(worksheetQueueActionsService, worksheetRepository)

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

  app.use('/worksheets', secured,
    worksheetRoutes(legacyWorksheetQueueRepository, worksheetQueueActionsService, takeNextWorksheetService))
  app.use('/worksheets/buildings', secured, buildingRoutes)
}
