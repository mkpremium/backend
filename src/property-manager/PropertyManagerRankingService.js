import moment from 'moment-timezone'

export class PropertyManagerRankingService {
  constructor (propertyManagersRepository, stockRepository, now = () => moment()) {
    this.propertyManagersRepository = propertyManagersRepository
    this.stockRepository = stockRepository
    this.now = now
  }

  async ranking () {
    const propertyManagers = await this.propertyManagersRepository.getActivePropertyManagers()

    const now = this.now()
    const propertyManagerStockPerformanceForCurrentYear = await this.stockRepository.getTotalProfitInPeriodByPropertyManager(
      now.clone().startOf('year'), now.clone().endOf('year')
    )

    return propertyManagers.map((pm) => {
      const stockPerformance = propertyManagerStockPerformanceForCurrentYear.find(sp => sp.propertyManagerId === pm.id)

      const goal = propertyManagerProfitGoalAmount(pm)
      const profit = stockPerformance ? stockPerformance.profitAmount : 0

      return {
        userId: pm.id,
        userName: pm.userName,
        userCity: pm.city,
        goal,
        currentProfit: profit,
        percentageGoal: profit / goal,
        awards: [],
        maxLine: pm.maxLine
      }
    }).sort((a, b) => b.percentageGoal - a.percentageGoal)
      .map((elem, idx) => ({ ...elem, rank: idx + 1 }))
  }
}

const propertyManagerProfitGoalAmount = pm => {
  if (!pm.profitGoal) return pm.city === 'Lisboa' ? 700000 : 500000

  return pm.profitGoal
}
