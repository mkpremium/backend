import { N1qlQuery } from 'couchbase'

const statsByPropertyManagerInPeriodQuery = `
    SELECT close.operatorId as propertyManagerId,
        SUM(sell.transactionAmount - purchase.transactionAmount) as profitAmount

    FROM mkpremium
    WHERE _documentType = 'stock'
    AND close IS NOT NULL
    AND close.transactionDate BETWEEN $1 AND $2
    GROUP BY close.operatorId
    `

export class StockRepository {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
  }

  getTotalProfitInPeriodByPropertyManager (since, until) {
    return this.couchbaseBucket.queryAsync(
      N1qlQuery.fromString(statsByPropertyManagerInPeriodQuery).consistency(N1qlQuery.Consistency.STATEMENT_PLUS),
      [since.format('YYYY-MM-DD'), until.format('YYYY-MM-DD')]
    )
  }
}
