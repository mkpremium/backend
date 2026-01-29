import moment from 'moment'
import type { EntityManager } from 'typeorm'
import { Stock } from '../stock.entity'
import { Flipper } from '../../flipper/flipper.entity'

export class StockPerformanceService {
  constructor (
    private entityManager: EntityManager
  ) {
  }

  async getFlipperProfitInPeriod (flipperUserId: string, since: moment.Moment, until: moment.Moment) {
    const flipper = await this.entityManager.findOneByOrFail(Flipper, { user: { id: flipperUserId } })
    const result = await this.entityManager.createQueryBuilder(Stock, 'stock')
      .innerJoin('stock.building', 'building')
      .innerJoin('stock.purchaseTransaction', 'purchase')
      .innerJoin('stock.sellTransaction', 'sell')
      .innerJoin('stock.closeEntity', 'close')
      .select('SUM(sell."transactionAmount"::numeric - purchase."transactionAmount"::numeric) AS profitAmount')
      .where('building.assignedFlipperId = :flipperId', { flipperId: flipper.id })
      .andWhere('close.transactionDate BETWEEN :since AND :until', {
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
