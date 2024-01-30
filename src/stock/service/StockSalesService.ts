import t from 'tcomb'
import { OwnerBusinessStatus } from '../../owner/owner'
import { createTransaction } from '../application'
import { StockStatuses } from '../types'
import {
  UpdateBuildingNegotiationStatusService
} from '../../building/service/update-building-negotiation-status.service'
import type { LegacyBuildingRepository } from '../../building/models'
import type { StockRepository } from '../models'
import { BuildingNegotiationStatus } from '../../building/building'

export class StockSalesService {
  constructor (
    private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
    private legacyBuildingsRepository: LegacyBuildingRepository,
    private legacyStockRepository: StockRepository,
  ) {
  }

  async sellStock (params: { buildingId: string }, operatorId: string) {
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
          status: OwnerBusinessStatus.ALREADY_SOLD as BuildingNegotiationStatus,
          userId: operatorId
        }
      )

    return result
  }
}
