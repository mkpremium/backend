import { Entity, ManyToMany, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from '../building/building.entity'

@Entity()
export class Owner extends BaseEntity {
  @OneToMany(() => Building, building => building.featuredOwner)
  featuredInBuildings: Building[]

  @ManyToMany(() =>Building, building => building.owners)
  buildings: Building[]
}
