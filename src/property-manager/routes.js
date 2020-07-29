import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import moment from 'moment'

export const createPropertyManagerRouter = (stockRepository) => {
  const router = new Router()

  router.get('/:propertyManagerId/stock-performance', wrap(async (req, res) => {
    const propertyManagerProfit = await stockRepository.getPropertyManagerProfitInPeriod(
      req.params.propertyManagerId,
      moment(`${req.query.year}-01-01`),
      moment(`${req.query.year}-12-31`)
    )

    res.json(propertyManagerProfit)
  }))
  return router
}
