import { Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from '../building/building.entity'

@Entity()
export class Owner extends BaseEntity {
  @OneToMany(() => Building, building => building.featuredOwner)
  featuredInBuildings: Building[]
}
