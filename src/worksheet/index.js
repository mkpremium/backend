import routes from './routes'
import buildingRoutes from './building/routes'

import './types'
import jwt from '../middleware/jwt'
import { logger } from '../infrastructure/logger'

export default (app, { eventBus }, { worksheetRepository }) => {
  const secured = jwt()

  eventBus
    .on('BUILDING_NEGOTIATION_STATUS_CHANGED', async ({ buildingId, operatorId }) => {
      logger.info('updating worksheet because building negotiation status changed', { buildingId, operatorId })
      const worksheet = await worksheetRepository.findWorksheetByBuilding(buildingId)
      await worksheetRepository.updateWorkSheetStatus(worksheet.id, operatorId)
    })

  app.use('/worksheets', secured, routes)
  app.use('/worksheets/buildings', secured, buildingRoutes)
}
