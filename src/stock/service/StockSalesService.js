import t from 'tcomb'
import { OwnerBusinessStatus } from '../../types/enums'
import { createTransaction } from '../application'
import { StockStatuses } from '../types'

export class StockSalesService {
  constructor (updateBuildingNegotiationStatusService, legacyBuildingRepository, legacyStockRepository) {
    this.legacyStockRepository = legacyStockRepository
    this.legacyBuildingRepository = legacyBuildingRepository
    this.updateBuildingNegotiationStatusService = updateBuildingNegotiationStatusService
  }

  async sellStock (params = {}, operatorId) {
    await this.legacyBuildingRepository.findByIdOrThrow(params.buildingId)
    const stock = await this.legacyStockRepository.findByBuildingIdOrThrow(params.buildingId)

    const sell = createTransaction(params, operatorId)
    const updatedStock = t.update(stock, {
      sell: { $set: sell },
      currentStatus: { $set: StockStatuses.SELL }
    })

    const result = await this.legacyStockRepository.save(updatedStock)
    await this.updateBuildingNegotiationStatusService.updateBuildingStatus(params.buildingId, OwnerBusinessStatus.ALREADY_SOLD)

    return result
  }
}
