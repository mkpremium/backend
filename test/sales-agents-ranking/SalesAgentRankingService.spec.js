import { SalesAgentRankingService } from '../../src/sales-agents-ranking/SalesAgentRankingService'
import { Promise } from 'bluebird'
import { expect } from 'chai'
import sinon from 'sinon'
import moment from 'moment-timezone'

const matchingMoment = (momentToMatch) => sinon.match(
  (actual) => actual.toString() === momentToMatch.toString()
)

describe.only('SalesAgentRankingService', () => {
  const now = () => moment('2020-01-12') // January 12, 2020
  const firstMomentCurrentYear = moment('2020-01-01')
  const lastMomentCurrentYear = moment('2020-12-31').endOf('day')

  const barcelonaSalesAgentWithoutProfitGoal = {
    id: 'sales-agent-user-id',
    name: 'Sales Agent Full Name',
    city: 'Barcelona'
  }

  const salesAgentsRepository = {
    getActiveSalesAgents: null
  }
  const stockRepository = {
    getStatsBySalesAgentInPeriod: null
  }

  let rankingService

  beforeEach(() => {
    salesAgentsRepository.getActiveSalesAgents = sinon.stub().returns(Promise.resolve([]))
    stockRepository.getStatsBySalesAgentInPeriod = sinon.stub().returns(Promise.resolve([]))

    rankingService = new SalesAgentRankingService(
      salesAgentsRepository,
      stockRepository,
      now
    )
  })

  it('gets all active sales agents from users repository', async () => {
    await rankingService.ranking()

    expect(salesAgentsRepository.getActiveSalesAgents).to.have.been.calledWith()
  })

  it('gets closed stock grouped by sales agent', async () => {
    await rankingService.ranking()

    expect(stockRepository.getStatsBySalesAgentInPeriod).to.have.been
      .calledWith(matchingMoment(firstMomentCurrentYear), matchingMoment(lastMomentCurrentYear))
  })

  it('returns sales agent user information', async () => {
    salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([barcelonaSalesAgentWithoutProfitGoal]))

    const ranking = await rankingService.ranking()

    expect(ranking[0]).to.include({
      userId: barcelonaSalesAgentWithoutProfitGoal.id,
      userName: barcelonaSalesAgentWithoutProfitGoal.name,
      userCity: barcelonaSalesAgentWithoutProfitGoal.city
    })
  })

  describe('sales agent profit goal', () => {
    const generalProfitGoal = 500000
    const lisbonProfitGoal = 700000

    it(
      'applies general default goal for sales agent without goal in a city different than Lisbon',
      async () => {
        salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([barcelonaSalesAgentWithoutProfitGoal]))
        const ranking = await rankingService.ranking()

        expect(ranking[0].goal).to.be.equal(generalProfitGoal)
      }
    )

    it('applies Lisbon default goal for sales agent without goal in Lisbon', async () => {
      const lisbonSalesAgentWithoutProfitGoal = {...barcelonaSalesAgentWithoutProfitGoal, city: 'Lisboa'}
      salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([lisbonSalesAgentWithoutProfitGoal]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].goal).to.be.equal(lisbonProfitGoal)
    })

    it('applies sales agent profit goal', async () => {
      const salesAgentProfitGoal = {amount: 100000}
      const salesAgentWithProfitGoal = {...barcelonaSalesAgentWithoutProfitGoal, profitGoal: salesAgentProfitGoal}
      salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([salesAgentWithProfitGoal]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].goal).to.be.equal(salesAgentProfitGoal.amount)
    })
  })

  describe('profit calculation', () => {
    it('gets profits from sales agent stocks total gains', async () => {
      salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([barcelonaSalesAgentWithoutProfitGoal]))
      stockRepository.getStatsBySalesAgentInPeriod.returns(Promise.resolve([
        {
          salesAgentId: barcelonaSalesAgentWithoutProfitGoal.id,
          profitAmount: 50000
        }
      ]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].currentProfit).to.be.equal(50000)
    })
  })

  describe('ranking calculation', () => {
    it('calculates percentageGoal based on profit calculation and sales agent profit goal', async () => {
      salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([
        {...barcelonaSalesAgentWithoutProfitGoal, profitGoal: {amount: 120}}
      ]))
      stockRepository.getStatsBySalesAgentInPeriod.returns(Promise.resolve([
        {
          salesAgentId: barcelonaSalesAgentWithoutProfitGoal.id,
          profitAmount: 60
        }
      ]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].percentageGoal).to.be.closeTo(0.5, 0.001)
    })

    it('calculates ranking based on achieved percentage goal', async () => {
      const salesAgentWith20PercentAchievedProfitGoal = {
        ...barcelonaSalesAgentWithoutProfitGoal,
        id: '20%',
        profitGoal: {amount: 120}
      }
      const salesAgentWith50PercentAchievedProfitGoal = {
        ...barcelonaSalesAgentWithoutProfitGoal,
        id: '50%',
        profitGoal: {amount: 120}
      }

      salesAgentsRepository.getActiveSalesAgents.returns(Promise.resolve([
        salesAgentWith20PercentAchievedProfitGoal, salesAgentWith50PercentAchievedProfitGoal
      ]))

      stockRepository.getStatsBySalesAgentInPeriod.returns(Promise.resolve([
        {
          salesAgentId: salesAgentWith20PercentAchievedProfitGoal.id,
          profitAmount: 24
        },
        {
          salesAgentId: salesAgentWith50PercentAchievedProfitGoal.id,
          profitAmount: 60
        }
      ]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].rank).to.be.deep.equal(1)
      expect(ranking[0].percentageGoal).to.be.deep.equal(0.5)

      expect(ranking[1].rank).to.be.deep.equal(2)
      expect(ranking[1].percentageGoal).to.be.deep.equal(0.2)
    })
  })
})
