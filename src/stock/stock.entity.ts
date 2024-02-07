import { Column, Entity, ManyToOne } from 'typeorm'
import { Building } from '../building/building.entity'
import { BaseEntity } from '../infrastructure/entity'

export enum StockStatus {
  PURCHASE = 'PURCHASE',
  SELL = 'SELL',
  CLOSE = 'CLOSE',
}

@Entity()
export class Stock extends BaseEntity {
  @ManyToOne(() => Building)
  building: Building

  @Column({
    type: 'enum',
    enum: StockStatus
  })
  currentStatus: StockStatus

  @Column('jsonb', { nullable: true })
  purchase?: {
    operatorId: string;
    reservationAmount: number;
    reservationDate: Date;
    transactionAmount: number;
    transactionDate: Date;
  }

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number

  @Column('jsonb', { nullable: true })
  sell?: {
    operatorId: string;
    reservationAmount: number;
    reservationDate: Date;
    transactionAmount: number;
    transactionDate: Date;
  }

  @Column('jsonb', { nullable: true })
  close?: {
    operatorId: string;
    gain: number;
    transactionDate: Date;
  }
}
