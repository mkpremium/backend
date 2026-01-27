import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Flipper } from '../flipper/flipper.entity'
import { Caller } from '../caller/caller.entity'
import { UserProfile } from './user-profile.entity'
import { StockTransaction } from '../stock/stock-transaction.entity'
import { StockClose } from '../stock/stock-close.entity'

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @Column()
  enabled: boolean

  @OneToOne(() => Flipper, flipper => flipper.user)
  flipper?: Flipper

  @OneToOne(() => Caller, caller => caller.user)
  caller?: Caller

  @Column({ default: false })
  isAdmin: boolean

  @OneToOne(() => UserProfile, userProfile => userProfile.user)
  @JoinColumn({ name: 'profileId' })
  profileEntity: UserProfile

  @OneToMany(() => StockTransaction, transaction => transaction.flipperOrUser)
  transactions: StockTransaction[]

  @OneToMany(() => StockClose, close => close.flipperOrUser)
  closes: StockClose[]
}
