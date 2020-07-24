import {addStockRoutes} from './routes.js'
import './types'
import jwt from '../middleware/jwt'

export default (app, {
  propertyManagerRankingService,
  stockSalesService,
  createPurchaseStockService
}) => {
  const secured = jwt()
  app.use('/stock', secured, addStockRoutes(
    propertyManagerRankingService,
    stockSalesService,
    createPurchaseStockService
  ))
}
