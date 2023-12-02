import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'

@Entity()
export class User extends BaseEntity {
  @Column()
  username: string

  @Column()
  password: string
}
