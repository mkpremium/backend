import moment from 'moment'
import type { EntityManager } from 'typeorm'
import { Stock } from '../stock.entity'

export class StockPerformanceService {
  constructor (
    private entityManager: EntityManager
  ) {
  }

  async getFlipperProfitInPeriod (flipperId: string, since: moment.Moment, until: moment.Moment) {
    const result = await this.entityManager.createQueryBuilder(Stock, 'stock')
      .innerJoin('stock.building', 'building')
      .select('SUM((stock.sell ->> \'transactionAmount\')::numeric - (stock.purchase ->> \'transactionAmount\')::numeric) as profitAmount')
      .where('building.assignedFlipperId = :flipperId', { flipperId })
      .andWhere('(stock.close ->> \'transactionDate\') BETWEEN :since AND :until', {
        since: since.toDate(),
        until: until.toDate()
      })
      .getRawOne()

    return Promise.resolve({
      profitAmount: Number(result.profitamount) || 0,
      goal: 0
    })
  }
}
