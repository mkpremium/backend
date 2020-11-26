import { worksheetRoutes } from './routes'
import buildingRoutes from './building/routes'

import './types'
import jwt from '../middleware/jwt'
import { logger } from '../infrastructure/logger'

/**
 * @param app
 * @param eventBus
 * @param {WorksheetRepository} worksheetRepository
 * @param worksheetQueueRepository
 */
export default (app,
  { eventBus, worksheetQueueActionsService },
  { worksheetRepository, worksheetQueueRepository }
) => {
  const secured = jwt()

  eventBus
    .on('BUILDING_NEGOTIATION_STATUS_CHANGED', async ({ buildingId, operatorId }) => {
      logger.info('updating worksheet because building negotiation status changed', { buildingId, operatorId })
      try {
        const worksheet = await worksheetRepository.findWorksheetByBuilding(buildingId)
        await worksheetRepository.updateStatus(worksheet.id, operatorId)
      } catch (error) {
        logger.crit('could not update worksheet on building status change', { error })
      }
    })

  app.use('/worksheets', secured, worksheetRoutes(worksheetQueueRepository, worksheetQueueActionsService))
  app.use('/worksheets/buildings', secured, buildingRoutes)
}
