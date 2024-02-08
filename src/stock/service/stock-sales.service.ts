import { EntityManager } from 'typeorm'
import { Stock, Transaction } from '../stock.entity'
import {
  UpdateBuildingNegotiationStatusService
} from '../../building/service/update-building-negotiation-status.service'
import { createTransaction, type TransactionInput } from './create-transaction'
import type { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { StockStatuses } from '../types'

export class StockSalesService {
  constructor (
    private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
    private entityManager: EntityManager,
    private eventBus: EventPublisher
  ) {
  }

  async updateSellStock (params: { buildingId: string } & Transaction & {
    reservationDate: string;
    transactionDate: string
  }, operatorId: string): Promise<Stock> {
    const stock = await this.getStockOrFail(params.buildingId)
    if (stock.currentStatus === StockStatuses.CLOSE) {
      throw new Error(`El stock se encuentra en estado ${StockStatuses.CLOSE}`)
    }

    return await this.entityManager.transaction(async transactionalEntityManager => {
      stock.sell = createTransaction(params, operatorId)

      await transactionalEntityManager.save(stock)

      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_SELL_UPDATED,
        buildingId: params.buildingId,
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
  }

  async sellStock (params: { buildingId: string } & TransactionInput, operatorId: string) {
    const stock = await this.getStockOrFail(params.buildingId)

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
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
  }

  async updatePurchaseStock (params: { buildingId: string } & Transaction & {
    reservationDate: string;
    transactionDate: string
  }, operatorId: string): Promise<Stock> {
    const stock = await this.getStockOrFail(params.buildingId)

    return await this.entityManager.transaction(async transactionalEntityManager => {
      stock.purchase = createTransaction(params, operatorId)

      await transactionalEntityManager.save(stock)
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_PURCHASE_UPDATED,
        buildingId: params.buildingId,
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
  }

  async closeSellStock (params: { buildingId: string } & Transaction & {
    reservationDate: string;
    transactionDate: string
  }, operatorId: string): Promise<Stock> {
    return await this.entityManager.transaction(async transactionalEntityManager => {
      const stock = await this.getStockOrFail(params.buildingId)

      if (stock.currentStatus !== 'SELL') {
        throw new Error('El stock no se encuentra en estado "SELL"')
      }

      const gain = stock.sell.transactionAmount - stock.purchase.transactionAmount
      stock.close = {
        operatorId,
        gain,
        transactionDate: new Date()
      }
      stock.currentStatus = 'CLOSE'

      await transactionalEntityManager.save(stock)
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_CLOSED,
        buildingId: params.buildingId,
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
  }

  private async getStockOrFail (buildingId: string): Promise<Stock> {
    const stock = await this.entityManager.findOneBy(Stock, { building: { id: buildingId } })

    if (!stock) {
      throw new Error(`Stock not found for buildingId: ${buildingId}`)
    }
    return stock
  }
}
