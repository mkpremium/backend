import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from '../building/building.entity'
import { Person } from './person.entity'

@Entity()
export class Owner extends BaseEntity {
  @OneToOne(() => Person)
  @JoinColumn()
  person: Person

  @OneToMany(() => Building, building => building.featuredOwner)
  featuredInBuildings: Building[]

  @ManyToOne(() => Building)
  building: Building[]

  // TODO: declare type for OwnerStatus
  @Column('text')
  status: string
}
