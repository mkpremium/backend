import { addStockRoutes } from './routes'

export const setupStockRouter = (app, container, secured) => {
  app.use('/stock', secured, addStockRoutes(
    container.resolve('propertyManagerRankingService'),
    container.resolve('stockSalesService'),
    container.resolve('stockService')
  ))
}
