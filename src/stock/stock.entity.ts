import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { Building } from '../building/building.entity'
import { BaseEntity } from '../infrastructure/entity'
import { StockTransaction } from './stock-transaction.entity'
import { StockClose } from './stock-close.entity'

export interface Transaction {
  flipperOrUserId: string;
  reservationAmount: number;
  reservationDate: Date;
  transactionAmount: number;
  transactionDate: Date;
}

@Entity()
export class Stock extends BaseEntity {
  @OneToOne(() => Building)
  @JoinColumn()
  building: Building

  @Column('text')
  currentStatus: 'PURCHASE' | 'SELL' | 'CLOSE'

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number

  @OneToOne(() => StockTransaction, transaction => transaction.stockPurchase)
  @JoinColumn({ name: 'purchaseId' })
  purchaseTransaction: StockTransaction

  @OneToOne(() => StockTransaction, transaction => transaction.stockSell)
  @JoinColumn({ name: 'sellId' })
  sellTransaction: StockTransaction

  @OneToOne(() => StockClose, close => close.stock)
  @JoinColumn({ name: 'closeId' })
  closeEntity: StockClose
}
