import { expect } from 'chai'
import moment from 'moment-timezone'
import { type ResolvedDeps, resolveDependencies } from '../helpers'
import type { StockPerformanceService } from '../../src/stock/service/stock-performance.service'
import { StockSalesService } from '../../src/stock/service/stock-sales.service'
import { Factory } from 'rosie'
import { buildingFactory } from '../factories'

describe.skip('StockPerformanceService', function () {
  let stockPerformanceService: StockPerformanceService
  let stockSalesService: StockSalesService
  let deps: ResolvedDeps
  const now = moment()
  const tomorrow = now.clone().add(1, 'day')

  beforeEach(async function () {
    deps = await resolveDependencies()
    stockSalesService = deps.container.resolve('stockSalesService')

    stockPerformanceService = deps.container.resolve('stockPerformanceService')
  })

  it('returns total profit made by property owners', async function () {
    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))

    // const { closeSellStock } = import('../../src/stock/application')
    // const closeSellStock = () => null

    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const buildingPurchaseAmount = 1000
    const buildingSellingAmount = 1200
    await purchaseBuildingByFlipper(stockSalesService, testBuilding, testFlipper, buildingPurchaseAmount)
    await sellBuilding(deps.container, testBuilding, testFlipper, buildingSellingAmount)

    // await closeSellStock({ buildingId: testBuilding.id }, propertyManager.id)

    const result =
      await stockPerformanceService.getFlipperProfitInPeriod(testFlipper.id, now.clone().subtract(1, 'days'), tomorrow)

    expect(result).to.be.deep.equal({
      goal: 0,
      profitAmount: 200
    })
  })
})

function purchaseBuildingByFlipper (createPurchaseStockService, building, agent, transactionAmount) {
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
