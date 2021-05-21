import t from 'tcomb'
import { OwnerBusinessStatus } from '../../owner/owner'
import { createTransaction } from '../application'
import { StockStatuses } from '../types'

export class StockSalesService {
  constructor (updateBuildingNegotiationStatusService, legacyBuildingsRepository, legacyStockRepository) {
    this.legacyStockRepository = legacyStockRepository
    this.legacyBuildingsRepository = legacyBuildingsRepository
    this.updateBuildingNegotiationStatusService = updateBuildingNegotiationStatusService
  }

  async sellStock (params = {}, operatorId) {
    await this.legacyBuildingsRepository.findByIdOrThrow(params.buildingId)
    const stock = await this.legacyStockRepository.findByBuildingIdOrThrow(params.buildingId)

    const sell = createTransaction(params, operatorId)
    const updatedStock = t.update(stock, {
      sell: { $set: sell },
      currentStatus: { $set: StockStatuses.SELL }
    })

    const result = await this.legacyStockRepository.save(updatedStock)
    await this.updateBuildingNegotiationStatusService
      .updateBuildingStatus(
        params.buildingId,
        { status: OwnerBusinessStatus.ALREADY_SOLD, userId: operatorId }
      )

    return result
  }
}
