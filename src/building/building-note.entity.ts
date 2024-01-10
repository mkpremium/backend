import { BaseEntity } from '../infrastructure/entity'
import { Column, Entity, ManyToOne } from 'typeorm'
import { Building } from './building.entity'
import { User } from '../user/user.entity'

@Entity()
export class BuildingNote extends BaseEntity {
  @ManyToOne(() => Building, building => building.notes)
  building: Building

  @Column({nullable: false})
  note: string

  @Column(() => User)
  createdBy: User
}
