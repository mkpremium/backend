import { createFlipper } from '../common'
import moment from 'moment-timezone'
import { expect } from 'chai'
import { closeSellStock } from '../../src/stock/application'
import { LegacyBuildingRepository } from '../../src/building/models'
import { buildingData } from './stock.mock'
import { createTestContainer } from '../create-test-container'

describe.skip('StockRepository', function () {
  let container, stockRepository, stockService
  const now = moment()
  const tomorrow = now.clone().add(1, 'day')

  beforeEach(async function () {
    container = await createTestContainer()
    stockService = container.resolve('stockService')
    stockRepository = container.resolve('stockRepository')
  })

  describe('getTotalProfitInPeriodByPropertyManager', function () {
    it('returns total profit made by property owners', async function () {
      const propertyManager = await createFlipper()

      const testBuilding = await LegacyBuildingRepository.createNewBuilding(buildingData)
      const buildingPurchaseAmount = 1000
      const buildingSellingAmount = 1200
      await purchaseBuildingBySalesAgent(stockService, testBuilding, propertyManager, buildingPurchaseAmount)
      await sellBuilding(container, testBuilding, propertyManager, buildingSellingAmount)

      await closeSellStock({ buildingId: testBuilding.id }, propertyManager.id)

      const result = await stockRepository.getTotalProfitInPeriodByPropertyManager(now, tomorrow)

      expect(result).to.be.deep.equal([{
        propertyManagerId: propertyManager.id,
        profitAmount: 200
      }])
    })
  })
})

function purchaseBuildingBySalesAgent (createPurchaseStockService, building, agent, transactionAmount) {
  const params = {
    buildingId: building.id,
    reservationAmount: 1110.00,
    reservationDate: '2019-07-11T13:00:00.000Z',
    transactionAmount,
    transactionDate: '2019-07-11T13:00:00.000Z'
  }
  return createPurchaseStockService.purchaseBuilding(params, agent.id)
}

function sellBuilding (container, building, agent, transactionAmount) {
  const params = {
    buildingId: building.id,
    reservationAmount: 2000.00,
    reservationDate: '2019-07-11T13:00:00.000Z',
    transactionAmount,
    transactionDate: '2019-07-11T13:00:00.000Z'
  }
  const stockSalesService = container.resolve('stockSalesService')

  return stockSalesService.sellStock(params, agent.id)
}
