import { Entity, JoinColumn, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { User } from '../user/user.entity'

@Entity()
export class Caller extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User
  flipperId: string
}
