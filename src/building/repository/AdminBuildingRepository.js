import {N1qlQuery} from 'couchbase'
import moment from 'moment'

const ALL_AGENTS_STOCK_STATS_QUERY = `
SELECT
    building.id buildingId,
    (agent.profile.firstName || " " || agent.profile.lastName) AS agentName,
    building.\`use\`,
    building.landArea,
    building.address.fullAddress as buildingAddress,
    agent.id AS agentId,
    {'sell': stock.sell, 'purchase': stock.purchase} as stock
FROM mkpremium building
INNER JOIN mkpremium stock ON stock.buildingId = building.id AND stock._documentType = 'stock' AND (stock.close IS MISSING OR stock.close IS NULL)
INNER JOIN mkpremium agent ON agent._documentType = 'operator' AND building.assignedAgentId = agent.id
WHERE building._documentType = 'building'
`

export class AdminBuildingRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  allAgentsStockStats () {
    return this.couchbaseAdapter
      .queryAsync(N1qlQuery.fromString(ALL_AGENTS_STOCK_STATS_QUERY))
      .then(result =>
        result.map(({
          buildingId, use, landArea, buildingAddress, stock, agentName, agentId
        }) =>
          ({
            buildingId,
            agentName,
            agentId,
            use,
            landArea,
            buildingAddress,
            stock: {
              purchase: stock.purchase ? {
                reservationAmount: stock.purchase.reservationAmount,
                reservationDate: stock.purchase.reservationDate ? moment(stock.purchase.reservationDate).format() : undefined,
                transactionAmount: stock.purchase.transactionAmount,
                transactionDate: moment(stock.purchase.transactionDate).format()
              } : undefined,
              sell: stock && stock.sell ? {
                reservationAmount: stock.sell.reservationAmount,
                reservationDate: stock.sell.reservationDate ? moment(stock.sell.reservationDate).format() : undefined,
                transactionAmount: stock.sell.transactionAmount,
                transactionDate: moment(stock.sell.transactionDate).format()
              } : undefined
            }
          })
        ))
  }
}
