import moment from 'moment-timezone'

export class SalesAgentRankingService {
  constructor (salesAgentsRepository, stockRepository, now = () => moment()) {
    this.salesAgentsRepository = salesAgentsRepository
    this.stockRepository = stockRepository
    this.now = now
  }

  async ranking () {
    const salesAgents = await this.salesAgentsRepository.getActiveSalesAgents()

    const now = this.now()
    const salesAgentStockPerformanceForCurrentYear = await this.stockRepository.getStatsBySalesAgentInPeriod(
      now.clone().startOf('year'), now.clone().endOf('year')
    )

    return salesAgents.map((sa) => {
      const stockPerformance = salesAgentStockPerformanceForCurrentYear.find(sp => sp.salesAgentId === sa.id)

      const goal = salesAgentProfitGoalAmount(sa)
      const profit = stockPerformance ? stockPerformance.profitAmount : 0

      return {
        userId: sa.id,
        userName: sa.name,
        userCity: sa.city,
        goal,
        currentProfit: profit,
        percentageGoal: profit / goal,
        awards: []
      }
    }).sort((a, b) => b.percentageGoal - a.percentageGoal)
      .map((elem, idx) => ({...elem, rank: idx + 1}))
  }
}

const salesAgentProfitGoalAmount = sa => {
  if (sa.profitGoal === undefined) return sa.city === 'Lisboa' ? 700000 : 500000

  return sa.profitGoal.amount
}
