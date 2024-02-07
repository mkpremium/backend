import { Column, Entity, ManyToOne } from 'typeorm'
import { Building } from '../building/building.entity'
import { BaseEntity } from '../infrastructure/entity'

export interface Transaction {
  operatorId: string;
  reservationAmount: number;
  reservationDate: Date;
  transactionAmount: number;
  transactionDate: Date;
}

@Entity()
export class Stock extends BaseEntity {
  @ManyToOne(() => Building)
  building: Building

  @Column('text')
  currentStatus: 'PURCHASE' | 'SELL' | 'CLOSE'

  @Column('jsonb', { nullable: true })
  purchase: Transaction

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number

  @Column('jsonb', { nullable: true })
  sell?: Transaction

  @Column('jsonb', { nullable: true })
  close?: {
    operatorId: string;
    gain: number;
    transactionDate: Date;
  }
}
