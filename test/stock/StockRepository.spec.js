import { initApplication } from '../../test-e2e/helper/rest-api-helper'
import { operatorCreateBusiness } from '../common'
import moment from 'moment-timezone'
import { expect } from 'chai'
import { closeSellStock } from '../../src/stock/application'
import { BuildingRepository } from '../../src/building/models'
import { buildingData } from './stock.mock'
import Promise from 'bluebird'

const CONSISTENCY_THREDHOLD = 1000
describe('StockRepository', () => {
  let app, stockRepository, stockService
  const now = moment()
  const tomorrow = now.clone().add(1, 'day')

  beforeEach(async () => {
    app = await initApplication()
    stockService = app.locals.dependenciesContainer.stockService
    stockRepository = app.locals.dependenciesContainer.stockRepository
  })

  describe('getTotalProfitInPeriodByPropertyManager', () => {
    it('returns total profit made by property owners', async () => {
      const propertyManager = await operatorCreateBusiness()

      const testBuilding = await BuildingRepository.createNewBuilding(buildingData)
      const buildingPurchaseAmount = 1000
      const buildingSellingAmount = 1200
      await purchaseBuildingBySalesAgent(stockService, testBuilding, propertyManager, buildingPurchaseAmount)
      await sellBuilding(app, testBuilding, propertyManager, buildingSellingAmount)

      await closeSellStock({buildingId: testBuilding.id}, propertyManager.id)

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
    transactionAmount: transactionAmount,
    transactionDate: '2019-07-11T13:00:00.000Z'
  }
  return createPurchaseStockService.purchaseBuilding(params, agent.id)
}

function sellBuilding (app, building, agent, transactionAmount) {
  const params = {
    buildingId: building.id,
    reservationAmount: 2000.00,
    reservationDate: '2019-07-11T13:00:00.000Z',
    transactionAmount: transactionAmount,
    transactionDate: '2019-07-11T13:00:00.000Z'
  }
  const { stockSalesService } = app.locals.dependenciesContainer

  return stockSalesService.sellStock(params, agent.id)
}
