import { operatorCreateBusiness } from '../common'
import { StockRepository } from '../../src/stock/StockRepository'
import moment from 'moment-timezone'
import { expect } from 'chai'
import couchbase from '../../src/db/couchbase'
import { closeSellStock, createPurchaseStock, sellPurchasedStock } from '../../src/stock/application'
import { BuildingRepository } from '../../src/building/models'
import { buildingData } from './stock.mock'

describe('StockRepository', () => {
  const now = moment()
  const tomorrow = now.clone().add(1, 'day')

  let couchbaseBucket, stockRepository

  before(async () => {
    couchbaseBucket = await couchbase()
    stockRepository = new StockRepository(couchbaseBucket)
  })

  beforeEach(async () => {
    await couchbaseBucket.removeAll()
  })

  describe('getTotalProfitInPeriodByPropertyManager', () => {
    it('returns total profit made by property owners', async () => {
      const propertyManager = await operatorCreateBusiness()

      const testBuilding = await BuildingRepository.createNewBuilding(buildingData)
      const buildingPurchaseAmount = 1000
      const buildingSellingAmount = 1200
      await purchaseBuildingBySalesAgent(testBuilding, propertyManager, buildingPurchaseAmount)
      await sellBuilding(testBuilding, propertyManager, buildingSellingAmount)

      await closeSellStock({buildingId: testBuilding.id}, propertyManager.id)

      const result = await stockRepository.getTotalProfitInPeriodByPropertyManager(now, tomorrow)

      expect(result).to.be.deep.equal([{
        propertyManagerId: propertyManager.id,
        profitAmount: 200
      }])
    })
  })
})

function purchaseBuildingBySalesAgent (building, agent, transactionAmount) {
  const params = {
    buildingId: building.id,
    reservationAmount: 1110.00,
    reservationDate: '2019-07-11T13:00:00.000Z',
    transactionAmount: transactionAmount,
    transactionDate: '2019-07-11T13:00:00.000Z'
  }
  return createPurchaseStock(params, agent.id)
}

function sellBuilding (building, agent, transactionAmount) {
  const params = {
    buildingId: building.id,
    reservationAmount: 2000.00,
    reservationDate: '2019-07-11T13:00:00.000Z',
    transactionAmount: transactionAmount,
    transactionDate: '2019-07-11T13:00:00.000Z'
  }
  return sellPurchasedStock(params, agent.id)
}
