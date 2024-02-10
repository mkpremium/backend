export const setupStockRouter = async (app, container, secured) => {
  const { addStockRoutes } = await import('./routes')
  app.use('/stock', secured, addStockRoutes(
    container.resolve('propertyManagerRankingService'),
    container.resolve('stockSalesService'),
    container
  ))
}
