import { Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { User } from '../user/user.entity'
import { Flipper } from '../flipper/flipper.entity'

@Entity()
export class Caller extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn()
    user: User

  @ManyToOne(() => Flipper)
    flipper?: Flipper

  get flipperId () {
    return this.flipper?.id
  }
}
