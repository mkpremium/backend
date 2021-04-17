import fromJSON from 'tcomb/lib/fromJSON'
import { StockStatuses, TransactionParams } from '../types'
import { createTransaction } from '../application'
import t from 'tcomb'

export class StockService {
  /**
   * @param legacyStockRepository StockRepository
   * @param updateBuildingNegotiationStatusService UpdateBuildingNegotiationStatusService
   */
  constructor (legacyStockRepository, updateBuildingNegotiationStatusService) {
    this.legacyStockRepository = legacyStockRepository
    this.updateBuildingNegotiationStatusService = updateBuildingNegotiationStatusService
  }

  async purchaseBuilding (params, flipperId) {
    const createStockParams = fromJSON(params, TransactionParams)

    const purchase = createTransaction(params, flipperId)

    const stockExist = await this.legacyStockRepository.findByBuildingIdOrDefault(params.buildingId)

    if (stockExist) {
      throw new Error(`There is an stock related to the building with ID ${params.buildingId}`)
    }

    const { buildingId } = createStockParams
    await this.updateBuildingNegotiationStatusService.updateBuildingStatus(buildingId, {
      status: 'COMPRADO',
      userId: flipperId
    })

    const stock = {
      buildingId: createStockParams.buildingId,
      currentStatus: StockStatuses.PURCHASE,
      purchase
    }

    return this.legacyStockRepository.save(stock)
  }

  async cancelSale (buildingId, operatorId) {
    let stock = await this.legacyStockRepository.findByBuildingIdOrThrow(buildingId)

    if (stock.currentStatus !== StockStatuses.SELL) {
      throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`)
    }

    stock = t.update(stock, {
      sell: { $set: null },
      currentStatus: { $set: StockStatuses.PURCHASE }
    })

    const updatedStock = await this.legacyStockRepository.save(stock)

    await this.updateBuildingNegotiationStatusService.updateBuildingStatus(buildingId, {
      status: 'COMPRADO',
      userId: operatorId
    })

    return updatedStock
  }
}
