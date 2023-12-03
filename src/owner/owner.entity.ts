import { Entity, ManyToMany, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from '../building/building.entity'
import { BuildingToOwner } from '../building/building-to-owner.entity'
import { OwnerContact } from './owner-contact.entity'

@Entity()
export class Owner extends BaseEntity {
  @OneToMany(() => Building, building => building.featuredOwner)
  featuredInBuildings: Building[]

  @OneToMany(() => BuildingToOwner, bo => bo.owner)
  buildings: Building[]

  @OneToMany(() => OwnerContact, oc => oc.owner)
  contacts: OwnerContact[]
}
