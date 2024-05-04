import { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import type { StockPerformanceService } from '../stock/service/stock-performance.service'
import moment from 'moment/moment'

export function flipperRoutes (app, container, secured) {
  app.use('/flipper', secured, createRouter(container))
}

function createRouter (container) {
  const router = Router()
  router.get('/:flipperId/blocked-availability', wrap(container.resolve('flipperBlockedAvailabilityController')))
  router.put('/:flipperId/max-line', permissions.admin, wrap(container.resolve('setFlipperMaxLineController')))

  router.get('/:flipperId/stock-performance', wrap(async (req, res) => {
    const stockPerformanceService: StockPerformanceService = container.resolve('stockPerformanceService')
    const flipperProfit = await stockPerformanceService.getFlipperProfitInPeriod(
      req.params.flipperId,
      moment(`${req.query.year}-01-01`),
      moment(`${req.query.year}-12-31`)
    )

    res.json(flipperProfit)
  }))

  return router
}
