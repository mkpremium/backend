import {addStockRoutes} from './routes.js'
import './types'
import jwt from '../middleware/jwt'

export default (app, { propertyManagerRankingService }) => {
  const secured = jwt()
  app.use('/stock', secured, addStockRoutes(propertyManagerRankingService))
}
