import { N1qlQuery } from 'couchbase'

const statsByPropertyManagerInPeriodQuery = `
    SELECT
        close.operatorId as propertyManagerId,
        SUM(sell.transactionAmount - purchase.transactionAmount) as profitAmount
    FROM mkpremium
    WHERE _documentType = 'stock'
      AND close IS NOT NULL
      AND close.transactionDate BETWEEN $1 AND $2
    GROUP BY close.operatorId
`

const propertyManagerProfitInPeriodQuery = `
    SELECT
      MAX(agent.profitGoal.amount) as profitGoal,
      MAX(agent.profile.city) as agentCity,
      SUM(stock.sell.transactionAmount - stock.purchase.transactionAmount) as profitAmount
    FROM mkpremium stock
    JOIN mkpremium agent ON agent.id = stock.close.operatorId AND
        agent._documentType = 'operator'
    WHERE stock._documentType = 'stock'
      AND stock.close IS NOT NULL
      AND stock.close.operatorId = $1
      AND stock.close.transactionDate BETWEEN $2 AND $3
`

const cityGoal = city => city === 'Lisboa' ? 700000 : 500000

export class StockRepository {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
  }

  getTotalProfitInPeriodByPropertyManager (since, until) {
    return this.couchbaseBucket.queryAsync(
      N1qlQuery.fromString(statsByPropertyManagerInPeriodQuery).consistency(N1qlQuery.Consistency.STATEMENT_PLUS),
      [ since.format('YYYY-MM-DD'), until.format('YYYY-MM-DD') ]
    )
  }

  async getPropertyManagerProfitInPeriod (propertyManagerId, since, until) {
    const result = await this.couchbaseBucket.queryAsync(
      N1qlQuery.fromString(propertyManagerProfitInPeriodQuery).consistency(N1qlQuery.Consistency.STATEMENT_PLUS),
      [ propertyManagerId, since.format('YYYY-MM-DD'), until.format('YYYY-MM-DD') ]
    )

    if (!result || result.length === 0) {
      return 0
    }

    return {
      profitAmount: result[0].profitAmount,
      goal: result[0].profitGoal || cityGoal(result[0]['agentCity'])
    }
  }
}
