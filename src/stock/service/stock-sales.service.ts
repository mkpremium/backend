import { EntityManager } from 'typeorm'
import { Stock, Transaction } from '../stock.entity'
import {
  UpdateBuildingNegotiationStatusService
} from '../../building/service/update-building-negotiation-status.service'
import { createTransaction, type TransactionInput } from './create-transaction'
import type { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { StockStatuses } from '../types'
import { StockTransaction } from '../stock-transaction.entity'
import { User } from '../../user/user.entity'
import { StockClose } from '../stock-close.entity'

export class StockSalesService {
  constructor (
    private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
    private entityManager: EntityManager,
    private eventBus: EventPublisher
  ) {
  }

  async purchaseBuilding (params: { buildingId: string } & Transaction & {
    reservationDate: string;
    transactionDate: string
  }, operatorId: string): Promise<Stock> {
    const existingStock = await this.entityManager.findOneBy(Stock, { building: { id: params.buildingId } })
    if (existingStock) {
      throw new Error(`Stock already exists for buildingId: ${params.buildingId}`)
    }

    return await this.entityManager.transaction(async transactionalEntityManager => {
      const purchaseTransaction = createTransaction(params, operatorId)
      const savedPurchaseTransaction = await transactionalEntityManager.save(StockTransaction, purchaseTransaction)

      const stock = await transactionalEntityManager.save(Stock, {
        building: { id: params.buildingId },
        currentStatus: 'PURCHASE',
        purchaseTransaction: savedPurchaseTransaction
      })
      await this.updateBuildingNegotiationStatusService.updateBuildingStatus(params.buildingId, {
        status: 'COMPRADO',
        userId: operatorId,
        em: transactionalEntityManager
      })
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__BUILDING_PURCHASED,
        buildingId: params.buildingId,
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
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
      const sellTransaction = createTransaction(params, operatorId)
      const savedsellTransaction = await transactionalEntityManager.save(StockTransaction, sellTransaction)
      stock.sellTransaction = savedsellTransaction
      await transactionalEntityManager.save(stock)

      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_SELL_UPDATED,
        buildingId: params.buildingId,
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
  }

  async sellStock (params: { buildingId: string } & TransactionInput, flipperOrUserId: string) {
    const stock = await this.getStockOrFail(params.buildingId)

    return await this.entityManager.transaction(async transactionalEntityManager => {
      const sellTransaction = createTransaction(params, flipperOrUserId)
      const savedsellTransaction = await transactionalEntityManager.save(StockTransaction, sellTransaction)
      stock.currentStatus = 'SELL'
      stock.sellTransaction = savedsellTransaction
      await transactionalEntityManager.save(stock)

      await this.updateBuildingNegotiationStatusService.updateBuildingStatus(params.buildingId, {
        status: 'VENDIDO',
        userId: flipperOrUserId,
        em: transactionalEntityManager
      })
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_SELL_UPDATED,
        buildingId: params.buildingId,
        userId: flipperOrUserId
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
      const purchaseTransaction = createTransaction(params, operatorId)
      const savedPurchaseTransaction = await transactionalEntityManager.save(StockTransaction, purchaseTransaction)
      stock.purchaseTransaction = savedPurchaseTransaction

      await transactionalEntityManager.save(stock)
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_PURCHASE_UPDATED,
        buildingId: params.buildingId,
        userId: operatorId
      }, transactionalEntityManager)

      return stock
    })
  }

  async closeSellStock (buildingId: string, flipperOrUserId: string): Promise<Stock> {
    return await this.entityManager.transaction(async transactionalEntityManager => {
      const stock = await this.getStockOrFail(buildingId)
      if (!stock) {
        console.log('STOCK SIN DATOS')
        return
      }
      console.log('STOCK EXISTE', stock)
      if (stock.currentStatus !== 'SELL') {
        throw new Error('El stock no se encuentra en estado "SELL"')
      }

      const gain = stock.sellTransaction.transactionAmount - stock.purchaseTransaction.transactionAmount
      const user = await this.getUserOrFail(flipperOrUserId)
      if (!user) {
        console.log('USUARIO NO EXISTE')
        return
      }

      const closeEntity = new StockClose()

      closeEntity.flipperOrUser = user
      closeEntity.gain = gain
      closeEntity.transactionDate = new Date()

      const savedCloseEntity = await transactionalEntityManager.save(StockClose, closeEntity)

      stock.closeEntity = savedCloseEntity
      stock.currentStatus = 'CLOSE'

      await transactionalEntityManager.save(stock)
      await this.eventBus.publish({
        name: DomainEventCatalog.STOCK__STOCK_CLOSED,
        buildingId,
        userId: flipperOrUserId
      }, transactionalEntityManager)

      return stock
    })
  }

  /** eslint-next-line-disable @typescript-eslint/no-unused-vars */
  async cancelSale (buildingId: string, userId: string): Promise<Stock> {
    throw new Error(`Method not implemented. buildingId: ${buildingId}, userId: ${userId}`)
  }

  private async getStockOrFail (buildingId: string): Promise<Stock> {
    const stock = await this.entityManager.findOne(Stock, {
      where: { building: { id: buildingId } },
      relations: ['purchaseTransaction', 'sellTransaction', 'closeEntity']
    })

    if (!stock) {
      throw new Error(`Stock not found for buildingId: ${buildingId}`)
    }
    return stock
  }

  private async getUserOrFail (userId:string): Promise<User> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId }
    })

    if (!user) {
      throw new Error(`User not found for userId: ${userId}`)
    }
    return user
  }
}
