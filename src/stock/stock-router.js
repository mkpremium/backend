import jwt from '../middleware/jwt'
import { addStockRoutes } from './routes'

export const setupStockRouter = (app, container) => {
  const secured = jwt()

  app.use('/stock', secured, addStockRoutes(
    container.resolve('propertyManagerRankingService'),
    container.resolve('stockSalesService'),
    container.resolve('stockService')
  ))
}
