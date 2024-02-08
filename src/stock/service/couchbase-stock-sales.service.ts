import t from 'tcomb'
import { StockStatuses } from '../types'
import {
  UpdateBuildingNegotiationStatusService
} from '../../building/service/update-building-negotiation-status.service'
import type { LegacyBuildingRepository } from '../../building/models'
import type { StockRepository } from '../models'
import { createTransaction, type TransactionInput } from './create-transaction'
import type { StockSalesService } from './stock-sales.service'
import { updatePurchaseStock, updateSellStock } from '../application'
import { Stock, Transaction } from '../stock.entity'

export class CouchbaseStockSalesService implements StockSalesService {
  constructor (
    private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
    private legacyBuildingsRepository: LegacyBuildingRepository,
    private legacyStockRepository: StockRepository
  ) {
  }

  updateSellStock (params: { buildingId: string } & Transaction & { reservationDate: string; transactionDate: string }, operatorId: string): Promise<Stock> {
    return updateSellStock(params, operatorId)
  }

  updatePurchaseStock (body: any, operatorId: string): Promise<any> {
    return updatePurchaseStock(body, operatorId)
  }

  async sellStock (params: { buildingId: string } & TransactionInput, operatorId: string) {
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
        {
          status: 'VENDIDO',
          userId: operatorId
        }
      )

    return result
  }
}
