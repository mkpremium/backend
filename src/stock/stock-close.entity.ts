import { Column, Entity, ManyToOne, OneToOne } from 'typeorm'
import { User } from '../user/user.entity'
import { BaseEntity } from '../infrastructure/entity'
import { Stock } from './stock.entity'

@Entity()
export class StockClose extends BaseEntity {
    @ManyToOne(() => User, user => user.transactions)
    flipperOrUser: User

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    gain: number

    @Column()
    transactionDate: Date

    @OneToOne(() => Stock, stock => stock.closeEntity)
    stock: Stock
}
