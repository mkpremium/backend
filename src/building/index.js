import './types'
import { createBuildingRoutes } from './routes'
import jwt from '../middleware/jwt'

export default (app, {listBuildingsService}) => {
  const secured = jwt()
  app.use('/buildings', secured, createBuildingRoutes(listBuildingsService))
}
