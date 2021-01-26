import { N1qlQuery } from 'couchbase'

const statsByPropertyManagerInPeriodQuery = bucketName => `
    SELECT
        stock.close.operatorId as propertyManagerId,
        SUM(stock.sell.transactionAmount - stock.purchase.transactionAmount) - SUM(building.totalExpensesAmount) as profitAmount
    FROM ${bucketName} stock
    LEFT JOIN ${bucketName} building ON building._documentType = 'building' AND building.id = stock.buildingId
    WHERE stock._documentType = 'stock'
      AND stock.close IS NOT NULL
      AND stock.close.transactionDate BETWEEN $1 AND $2
    GROUP BY stock.close.operatorId
`

const propertyManagerProfitInPeriodQuery = bucketName => `
SELECT
  agent.profitGoal.amount as profitGoal,
  agent.profile.city as agentCity,
  ARRAY_SUM(ARRAY (s.sell.transactionAmount - s.purchase.transactionAmount) FOR s IN stock END)
  - ARRAY_SUM(ARRAY (b.totalExpensesAmount) FOR b IN building END) as profitAmount
FROM ${bucketName} agent
LEFT NEST ${bucketName} stock ON stock._documentType = 'stock'
    AND stock.close IS NOT NULL
    AND stock.close.operatorId = agent.id
    AND stock.close.transactionDate BETWEEN $2 AND $3
LEFT NEST ${bucketName} building ON building._documentType = 'building'
    AND ANY s IN stock SATISFIES s.buildingId = building.id END
WHERE agent._documentType = 'operator' AND agent.id = $1
`

const cityGoal = city => city === 'Lisboa' ? 700000 : 500000

export class StockRepository {
  /**
   * @param {CouchbaseAdapter} couchbaseAdapter
   */
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getTotalProfitInPeriodByPropertyManager (since, until) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(statsByPropertyManagerInPeriodQuery(this.couchbaseAdapter.bucketName))
        .consistency(N1qlQuery.Consistency.STATEMENT_PLUS),
      [ since.format('YYYY-MM-DD'), until.format('YYYY-MM-DD') ]
    ).catch(error => {
      throw error
    })
  }

  async getPropertyManagerProfitInPeriod (propertyManagerId, since, until) {
    const result = await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(propertyManagerProfitInPeriodQuery(this.couchbaseAdapter.bucketName))
        .consistency(N1qlQuery.Consistency.STATEMENT_PLUS),
      [ propertyManagerId, since.format('YYYY-MM-DD'), until.format('YYYY-MM-DD') ]
    )

    if (!result || result.length === 0) {
      return 0
    }

    return {
      profitAmount: result[ 0 ].profitAmount,
      goal: result[ 0 ].profitGoal || cityGoal(result[ 0 ][ 'agentCity' ])
    }
  }
}
