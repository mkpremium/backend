import { Column, Entity, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Flipper } from '../flipper/flipper.entity'
import { Caller } from '../caller/caller.entity'
import { UserProfileProps } from '../types/user'

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @Column()
  enabled: boolean

  @OneToOne(() => Flipper)
  flipper?: Flipper

  @OneToOne(() => Caller)
  caller?: Caller

  @Column('jsonb')
  profile: UserProfileProps
}
