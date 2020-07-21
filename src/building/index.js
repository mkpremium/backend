import './types'
import {createBuildingRoutes} from './routes'
import jwt from '../middleware/jwt'

export default (app, {
  listBuildingsService,
  listBuildingProposalsService,
  updateBuildingNegotiationStatusService,
  adminBuildingRepository
},
{
  ownerRepository, buildingRepository
}) => {
  const secured = jwt()
  app.use('/buildings', secured, createBuildingRoutes(
    listBuildingsService, listBuildingProposalsService, ownerRepository,
    updateBuildingNegotiationStatusService, buildingRepository,
    adminBuildingRepository
  ))
}
