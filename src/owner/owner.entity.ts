import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from '../building/building.entity'
import { Person } from './person.entity'
import type { OwnerType } from './owner'
import { OwnerStatus } from './owner'
import { BuildingLead } from '../building/building-lead.entity'
import { CallQueue } from '../retell/call-queue.entity'

@Entity()
export class Owner extends BaseEntity {
  @OneToOne(() => Person, person => person.owner)
  @JoinColumn()
  person: Person

  @OneToMany(() => Building, building => building.featuredOwner)
  featuredInBuildings: Building[]

  @ManyToOne(() => Building)
  building: Building

  @Column('text', { default: 'NO_VERIFICADO' })
  status: OwnerStatus

  @Column('text', { default: 'PRINCIPAL' })
  type: OwnerType

  @Column('text', { nullable: true })
  note: string

  @OneToMany(() => BuildingLead, lead => lead.owner)
  leads:BuildingLead[]

  @OneToMany(() => CallQueue, callQueue => callQueue.owner)
  callQueues?: CallQueue[]
}
