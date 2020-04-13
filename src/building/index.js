import './types'
import { createBuildingRoutes } from './routes'
import jwt from '../middleware/jwt'

export default (app) => {
  const secured = jwt()
  app.use('/buildings', secured, createBuildingRoutes())
}
