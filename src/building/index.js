import './types'
import { createBuildingRoutes } from './routes'
import jwt from '../middleware/jwt'

export default (app, { listBuildingsService, listBuildingProposalsService }, { ownerRepository }) => {
  const secured = jwt()
  app.use('/buildings', secured, createBuildingRoutes(listBuildingsService, listBuildingProposalsService, ownerRepository))
}
