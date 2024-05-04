import moment from 'moment'

export class StockPerformanceService {
  getTotalProfitInPeriodByPropertyManager (since: string, until: string) {
    return Promise.reject(new Error(`Not implemented. since: ${since}, until: ${until}`))
  }

  async getFlipperProfitInPeriod (flipperId: string, since: moment.Moment, until: moment.Moment) {
    console.log(`getFlipperProfitInPeriod: ${flipperId}, ${since}, ${until}`)
    return Promise.resolve({
      profitAmount: 0,
      goal: 0
    })
  }
}
