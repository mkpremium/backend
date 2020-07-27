import fromJSON from 'tcomb/lib/fromJSON'
import { StockStatuses, TransactionParams } from '../types'
import { createTransaction } from '../application'

export class StockService {
  /**
   * @param legacyStockRepository StockRepository
   * @param updateBuildingNegotiationStatusService UpdateBuildingNegotiationStatusService
   */
  constructor (legacyStockRepository, updateBuildingNegotiationStatusService) {
    this.legacyStockRepository = legacyStockRepository
    this.updateBuildingNegotiationStatusService = updateBuildingNegotiationStatusService
  }

  async purchaseBuilding (params, agentId) {
    const createStockParams = fromJSON(params, TransactionParams)

    const purchase = createTransaction(params, agentId)

    const stockExist = await this.legacyStockRepository.findByBuildingIdOrDefault(params.buildingId)

    if (stockExist) {
      throw new Error(`There is an stock related to the building with ID ${params.buildingId}`)
    }

    const { buildingId } = createStockParams
    await this.updateBuildingNegotiationStatusService.updateBuildingStatus(buildingId, 'COMPRADO')

    const stock = {
      buildingId: createStockParams.buildingId,
      currentStatus: StockStatuses.PURCHASE,
      purchase
    }

    return this.legacyStockRepository.save(stock)
  }
}
