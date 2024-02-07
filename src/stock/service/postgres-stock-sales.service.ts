import { EntityManager } from 'typeorm'
import { Stock } from '../stock.entity'
import {
  UpdateBuildingNegotiationStatusService
} from '../../building/service/update-building-negotiation-status.service'
import { createTransaction, type TransactionInput } from './create-transaction'
import type { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

export class PostgresStockSalesService {
  constructor (
    private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
    private entityManager: EntityManager,
    private eventBus: EventPublisher
  ) {
  }

  async sellStock (params: { buildingId: string } & TransactionInput, operatorId: string) {
    const stock = await this.entityManager.findOneBy(Stock, { building: { id: params.buildingId } })

    if (!stock) {
      throw new Error(`Stock not found for buildingId: ${params.buildingId}`)
    }

    return await this.entityManager.transaction(async transactionalEntityManager => {
      stock.sell = createTransaction(params, operatorId)
      stock.currentStatus = 'SELL'

      await transactionalEntityManager.save(stock)

      await this.updateBuildingNegotiationStatusService.updateBuildingStatus(params.buildingId, {
        status: 'VENDIDO',
        userId: operatorId,
        em: transactionalEntityManager
      })
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_SELL_UPDATED,
        buildingId: params.buildingId,
        userId: operatorId,
        negotiationStatus: 'VENDIDO'
      }, transactionalEntityManager)

      return stock
    })
  }
}
