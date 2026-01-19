import { Column, Entity, ManyToOne, OneToOne } from 'typeorm'
import { User } from '../user/user.entity'
import { BaseEntity } from '../infrastructure/entity'
import { Stock } from './stock.entity'

@Entity()
export class StockTransaction extends BaseEntity {
    @ManyToOne(() => User, user => user.transactions)
    flipperOrUser: User

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    reservationAmount: number

    @Column()
    reservationDate: Date

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    transactionAmount: number

    @Column()
    transactionDate: Date

    @OneToOne(() => Stock, stock => stock.purchaseTransaction)
    stockPurchase: Stock

    @OneToOne(() => Stock, stock => stock.sellTransaction)
    stockSell: Stock
}
