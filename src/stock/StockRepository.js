export class StockRepository {
  getTotalProfitInPeriodByPropertyManager (since, until) {
    return Promise.reject(new Error(`Not implemented. since: ${since}, until: ${until}`))
  }

  async getFlipperProfitInPeriod (propertyManagerId, since, until) {
    console.log(`getFlipperProfitInPeriod: ${propertyManagerId}, ${since}, ${until}`)
    return Promise.resolve({
      profitAmount: 0,
      goal: 0
    })
  }
}
