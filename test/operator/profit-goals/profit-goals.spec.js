import { expect } from 'chai'
import request from 'supertest'
import { setProfitGoalToOperator } from '../../../src/operator/ProfitGoal/application'
import { createFlipper, defaultPassword, operatorCreate, operatorLogin } from '../../common'
import { createTestApp } from '../../integration/create-test-app'

describe.skip('profit goals', function () {
  let salesAgent
  let app
  let operatorRepository

  const salesAgentProfitGoal = 1500

  beforeEach(async function () {
    app = await createTestApp({ postgres: true, couchbase: false })

    salesAgent = await createFlipper()
  })

  describe('setProfitGoalToOperator', function () {
    it('defines goal for an existing sales agent', async function () {
      const now = new Date()
      const nowStub = () => now

      const result = await setProfitGoalToOperator({
        operatorId: salesAgent.id,
        profitAmount: 1500
      }, operatorRepository, nowStub)

      expect(result.profitGoal).to.deep.equal({ amount: 1500, updatedAt: now })
    })

    it('throws an error when setting profit goal for an non existing sales agent', async function () {
      let error
      try {
        await setProfitGoalToOperator({ operatorId: 'fakeId', profitAmount: 1500 }, operatorRepository)
      } catch (err) {
        error = err
      }

      expect(error).to.not.be.null
      expect(error.message).to.equal('El operator fakeId no existe')
      expect(error.statusCode).to.equal(404)
    })
  })

  describe('endpoint', function () {
    it('sets profit goal to a sales agent', async function () {
      const operator = await operatorCreate()
      const authenticatedOperator = await operatorLogin(app,
        { username: operator.username, password: defaultPassword })

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
})
