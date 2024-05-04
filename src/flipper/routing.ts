import { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import type { StockRepository } from '../stock/StockRepository'
import moment from 'moment/moment'

export function flipperRoutes (app, container, secured) {
  app.use('/flipper', secured, createRouter(container))
}

function createRouter (container) {
  const router = Router()
  router.get('/:flipperId/blocked-availability', wrap(container.resolve('flipperBlockedAvailabilityController')))
  router.put('/:flipperId/max-line', permissions.admin, wrap(container.resolve('setFlipperMaxLineController')))

  router.get('/:flipperId/stock-performance', wrap(async (req, res) => {
    const stockRepository: StockRepository = container.resolve('stockRepository')
    const flipperProfit = await stockRepository.getFlipperProfitInPeriod(
      req.params.flipperId,
      moment(`${req.query.year}-01-01`),
      moment(`${req.query.year}-12-31`)
    )

    res.json(flipperProfit)
  }))

  return router
}
