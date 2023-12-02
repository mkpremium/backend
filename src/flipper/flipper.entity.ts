import { Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { Building } from '../building/building.entity'
import { BaseEntity } from '../infrastructure/entity'
import { User } from '../user/user.entity'

@Entity()
export class Flipper extends BaseEntity {
  @OneToMany(() => Building, building => building.assignedFlipper)
  assignedBuildings: Building

  @OneToOne(() => User)
  @JoinColumn()
  user: User
}
