import { expect } from 'chai'
import { closeSellStock, createPurchaseStock, sellPurchasedStock } from '../../../src/stock/application'
import { OperatorRepository } from '../../../src/operator/models'
import { operatorCreate } from '../../common'
import { BuildingRepository } from '../../../src/building/models'
import { buildingData } from '../../stock/stock.mock'
import { setProfitGoalToOperator } from '../../../src/operator/ProfitGoal/application'
import { StockRepository } from '../../../src/stock/models'

describe('Awards', () => {
  let operator1
  let testBuilding1
  let testBuilding2

  async function createTestPurchaseStock (buildingId, operatorId, transactionAmount) {
    const params = {
      buildingId: buildingId,
      reservationAmount: 1110.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: transactionAmount,
      transactionDate: '2019-07-11T13:00:00.000Z'
    }
    return createPurchaseStock(params, operatorId)
  }

  async function sellTestPurchaseStock (buildingId, operatorId, transactionAmount) {
    const params = {
      buildingId: buildingId,
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: transactionAmount,
      transactionDate: '2019-07-11T13:00:00.000Z'
    }
    return sellPurchasedStock(params, operatorId)
  }

  before(async () => {
    const stockRepository = new StockRepository()
    await stockRepository.deleteQuery()
    const operatorRepository = new OperatorRepository()
    await operatorRepository.deleteQuery()
    const buildingRepository = new BuildingRepository()
    await buildingRepository.deleteQuery()

    operator1 = await operatorCreate('1')
    testBuilding1 = await BuildingRepository.createNewBuilding(buildingData)
    testBuilding2 = await BuildingRepository.createNewBuilding(buildingData)
    await setProfitGoalToOperator({ operatorId: operator1.id, profitAmount: 500000 })
    await createTestPurchaseStock(testBuilding1.id, operator1.id, 100000)
    await sellTestPurchaseStock(testBuilding1.id, operator1.id, 600000)
    await closeSellStock({ buildingId: testBuilding1.id }, operator1.id)

    await createTestPurchaseStock(testBuilding2.id, operator1.id, 100000)
    await sellTestPurchaseStock(testBuilding2.id, operator1.id, 600000)
    await closeSellStock({ buildingId: testBuilding2.id }, operator1.id)
  })

  it.skip('User should have an award', async () => {
    const operatorRepository = new OperatorRepository()
    const awardedOperator = await operatorRepository.findByIdOrThrow(operator1.id)
    console.log(awardedOperator)
    expect(awardedOperator.awards.length).to.be.equal(2)
    expect(awardedOperator.awards[0].code).to.be.equal('SUPER_SELL')
  })
})
