import { FlipperRankingService } from '../../src/flipper/service/flipper-ranking.service'
import { Promise } from 'bluebird'
import { expect } from 'chai'
import sinon from 'sinon'
import moment from 'moment-timezone'

const matchingMoment = (momentToMatch) => sinon.match(
  (actual) => actual.toString() === momentToMatch.toString()
)

describe('FlipperRankingService', function () {
  const now = () => moment('2020-01-12') // January 12, 2020
  const firstMomentCurrentYear = moment('2020-01-01')
  const lastMomentCurrentYear = moment('2020-12-31').endOf('day')

  const barcelonaFlipperWithoutProfitGoal = {
    id: 'property-manager-user-id',
    userName: 'Property Manager Full Name',
    city: 'Barcelona'
  }

  const propertyManagersRepository = {
    getActivePropertyManagers: null
  }
  const stockRepository = {
    getTotalProfitInPeriodByPropertyManager: null
  }

  let rankingService

  beforeEach(function () {
    propertyManagersRepository.getActivePropertyManagers = sinon.stub().returns(Promise.resolve([]))
    stockRepository.getTotalProfitInPeriodByPropertyManager = sinon.stub().returns(Promise.resolve([]))

    rankingService = new FlipperRankingService(
      propertyManagersRepository,
      stockRepository,
      now
    )
  })

  it('gets all active property managers from users repository', async function () {
    await rankingService.ranking()

    expect(propertyManagersRepository.getActivePropertyManagers).to.have.been.calledWith()
  })

  it('gets closed stock grouped by property manager', async function () {
    await rankingService.ranking()

    expect(stockRepository.getTotalProfitInPeriodByPropertyManager).to.have.been
      .calledWith(matchingMoment(firstMomentCurrentYear), matchingMoment(lastMomentCurrentYear))
  })

  it('returns property manager user information', async function () {
    propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([barcelonaFlipperWithoutProfitGoal]))

    const ranking = await rankingService.ranking()

    expect(ranking[0]).to.include({
      userId: barcelonaFlipperWithoutProfitGoal.id,
      userName: barcelonaFlipperWithoutProfitGoal.userName,
      userCity: barcelonaFlipperWithoutProfitGoal.city
    })
  })

  describe('property manager profit goal', function () {
    const generalProfitGoal = 500000
    const lisbonProfitGoal = 700000

    it(
      'applies general default goal for property manager without goal in a city different than Lisbon',
      async function () {
        propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([barcelonaFlipperWithoutProfitGoal]))
        const ranking = await rankingService.ranking()

        expect(ranking[0].goal).to.be.equal(generalProfitGoal)
      }
    )

    it('applies Lisbon default goal for property manager without goal in Lisbon', async function () {
      const lisbonPropertyManagerWithoutProfitGoal = { ...barcelonaFlipperWithoutProfitGoal, city: 'Lisboa' }
      propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([lisbonPropertyManagerWithoutProfitGoal]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].goal).to.be.equal(lisbonProfitGoal)
    })

    it('applies property manager profit goal', async function () {
      const propertyManagerProfitGoal = 100000
      const propertyManagerWithProfitGoal = { ...barcelonaFlipperWithoutProfitGoal, profitGoal: propertyManagerProfitGoal }
      propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([propertyManagerWithProfitGoal]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].goal).to.be.equal(propertyManagerProfitGoal)
    })
  })

  describe('profit calculation', function () {
    it('gets profits from property manager stocks total gains', async function () {
      propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([barcelonaFlipperWithoutProfitGoal]))
      stockRepository.getTotalProfitInPeriodByPropertyManager.returns(Promise.resolve([
        {
          propertyManagerId: barcelonaFlipperWithoutProfitGoal.id,
          profitAmount: 50000
        }
      ]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].currentProfit).to.be.equal(50000)
    })
  })

  describe('ranking calculation', function () {
    it('calculates percentageGoal based on profit calculation and property manager profit goal', async function () {
      propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([
        { ...barcelonaFlipperWithoutProfitGoal, profitGoal: 120 }
      ]))
      stockRepository.getTotalProfitInPeriodByPropertyManager.returns(Promise.resolve([
        {
          propertyManagerId: barcelonaFlipperWithoutProfitGoal.id,
          profitAmount: 60
        }
      ]))

      const ranking = await rankingService.ranking()

      expect(ranking[0].percentageGoal).to.be.closeTo(0.5, 0.001)
    })

    it('calculates ranking based on achieved percentage goal', async function () {
      const propertyManagerWith20PercentAchievedProfitGoal = {
        ...barcelonaFlipperWithoutProfitGoal,
        id: '20%',
        profitGoal: 120
      }
      const propertyManagerWith50PercentAchievedProfitGoal = {
        ...barcelonaFlipperWithoutProfitGoal,
        id: '50%',
        profitGoal: 120
      }

      propertyManagersRepository.getActivePropertyManagers.returns(Promise.resolve([
        propertyManagerWith20PercentAchievedProfitGoal, propertyManagerWith50PercentAchievedProfitGoal
      ]))

      stockRepository.getTotalProfitInPeriodByPropertyManager.returns(Promise.resolve([
        {
          propertyManagerId: propertyManagerWith20PercentAchievedProfitGoal.id,
          profitAmount: 24
        },
        {
          propertyManagerId: propertyManagerWith50PercentAchievedProfitGoal.id,
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
