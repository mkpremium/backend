import { defaultPassword, operatorCreate, operatorCreateBusiness, operatorLogin } from '../../common'
import { setProfitGoalToOperator } from '../../../src/operator/ProfitGoal/application'
import { expect } from 'chai'
import {
  closeSellStock,
  createPurchaseStock,
  getProfitGoalOperatorsRanking,
  sellPurchasedStock
} from '../../../src/stock/application'
import { OperatorRepository } from '../../../src/operator/models'
import { StockRepository } from '../../../src/stock/models'
import { BuildingRepository } from '../../../src/building/models'
import { buildingData } from '../../stock/stock.mock'
import app from '../../../src/app'
import request from 'supertest'

describe.only('profit goals', () => {
  let salesAgent

  const salesAgentProfitGoal = 1500
  const buildingRepository = new BuildingRepository()
  const stockRepository = new StockRepository()
  const operatorRepository = new OperatorRepository()

  beforeEach(async () => {
    await buildingRepository.deleteQuery()
    await stockRepository.deleteQuery()
    await operatorRepository.deleteQuery()

    salesAgent = await operatorCreateBusiness()
  })

  describe('setProfitGoalToOperator', () => {
    it('defines goal for an existing sales agent', async () => {
      const now = new Date()
      const nowStub = () => now

      const result = await setProfitGoalToOperator({ operatorId: salesAgent.id, profitAmount: 1500 }, nowStub)

      expect(result.profitGoal).to.deep.equal({amount: 1500, updatedAt: now})
    })

    it('throws an error when setting profit goal for an non existing sales agent', async () => {
      let error
      try {
        await setProfitGoalToOperator({ operatorId: 'fakeId', profitAmount: 1500 })
      } catch (err) {
        error = err
      }

      expect(error).to.not.be.null
      expect(error.message).to.equal('El operator fakeId no existe')
      expect(error.code).to.equal(404)
    })
  })

  describe('ranking', () => {
    it('calculates profit goal percentage achievement', async () => {
      await setProfitGoalToOperator({ operatorId: salesAgent.id, profitAmount: salesAgentProfitGoal })

      const testBuilding = await BuildingRepository.createNewBuilding(buildingData)

      const buildingPurchaseAmount = 1000
      const buildingSellingAmount = 1200
      await purchaseBuildingBySalesAgent(testBuilding, salesAgent, buildingPurchaseAmount)
      await sellBuilding(testBuilding, salesAgent, buildingSellingAmount)

      await closeSellStock({buildingId: testBuilding.id}, salesAgent.id)

      const profitRanking = await getProfitGoalOperatorsRanking()

      expect(profitRanking.length).to.be.equal(1)
      expect(profitRanking[0].userId).to.be.equal(salesAgent.id)
      expect(profitRanking[0].goal).to.be.equal(salesAgentProfitGoal)

      const expectedCurrentProfit = buildingSellingAmount - buildingPurchaseAmount
      expect(profitRanking[0].currentProfit).to.be.equal(expectedCurrentProfit)
      expect(profitRanking[0].percentageGoal)
        .to.be.closeTo(expectedCurrentProfit / salesAgentProfitGoal, 0.00001)
    })
  })

  describe('endpoint', () => {
    it('sets profit goal to a sales agent', async () => {
      const operator = await operatorCreate()
      const authenticatedOperator = await operatorLogin(app,
        {username: operator.username, password: defaultPassword})

      await request(app)
        .post('/operators/profit/goal')
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          profitAmount: salesAgentProfitGoal,
          operatorId: salesAgent.id
        })
        .expect(201)
        .then(response => {
          expect(response.body.profitGoal.amount).to.be.equal(salesAgentProfitGoal)
        })
    })
  })

  async function purchaseBuildingBySalesAgent (building, agent, transactionAmount) {
    const params = {
      buildingId: building.id,
      reservationAmount: 1110.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: transactionAmount,
      transactionDate: '2019-07-11T13:00:00.000Z'
    }
    await createPurchaseStock(params, agent.id)
  }

  async function sellBuilding (building, agent, transactionAmount) {
    const params = {
      buildingId: building.id,
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: transactionAmount,
      transactionDate: '2019-07-11T13:00:00.000Z'
    }
    await sellPurchasedStock(params, agent.id)
  }
})
