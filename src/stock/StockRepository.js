export class StockRepository {
  getTotalProfitInPeriodByPropertyManager (since, until) {
    throw new Error(`Not implemented. since: ${since}, until: ${until}`)
  }

  async getPropertyManagerProfitInPeriod (propertyManagerId, since, until) {
    throw new Error(`Not implemented. propertyManagerId: ${propertyManagerId}, since: ${since}, until: ${until}`)
  }
}
