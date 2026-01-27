import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { BuildingNegotiationStatus } from './building'
import { BuildingDocument } from './building-document.entity'
import { BaseEntity } from '../infrastructure/entity'
import { Owner } from '../owner/owner.entity'
import { Flipper } from '../flipper/flipper.entity'
import { Proposal } from './proposal.entity'
import _ from 'lodash'
import { Worksheet } from '../worksheet/worksheet.entity'
import { BuildingNote } from './building-note.entity'
import { Stock } from '../stock/stock.entity'
import { BuildingAddress } from './building-address.entity'
import { BuildingLead } from './building-lead.entity'
import { BuildingLocation } from './building-location.entity'

@Entity()
export class Building extends BaseEntity {
  @Column({ default: 'PENDIENTE' })
  negotiationStatus: BuildingNegotiationStatus

  @ManyToOne(() => Owner, owner => owner.featuredInBuildings, { nullable: true })
  featuredOwner?: Owner

  @ManyToOne(() => Flipper, flipper => flipper.assignedBuildings)
  assignedFlipper?: Flipper

  @Column({ type: 'float', nullable: true })
  floorArea: number

  // Spanish "Referencia Catastral". It's a unique identifier for a building.
  @Column({ nullable: true, unique: true })
  publicIdentifier?: string

  @Column({ nullable: true })
  use?: string

  @OneToMany(() => Proposal, proposal => proposal.building)
  proposals?: Proposal[]

  @OneToMany(() => BuildingDocument, document => document.building)
  documents: BuildingDocument[]

  @OneToMany(() => Owner, owner => owner.building)
  owners: Owner[]

  @OneToOne(() => Worksheet, worksheet => worksheet.building)
  worksheet: Worksheet

  @OneToMany(() => BuildingNote, note => note.building)
  notes: BuildingNote[]

  @OneToOne(() => Stock, (stock) => stock.building)
  stock?: Stock

  @OneToOne(() => BuildingAddress, (address) => address.building)
  @JoinColumn({ name: 'addressId' })
  addressEntity: BuildingAddress

  @OneToOne(() => BuildingLead, (lead) => lead.building)
  @JoinColumn({ name: 'leadId' })
  leadEntity: BuildingLead

  @OneToOne(() => BuildingLocation, (location) => location.building)
  @JoinColumn({ name: 'locationId' })
  locationEntity: BuildingLocation

  get recentProposal (): Proposal | undefined {
    return _.sortBy(this.proposals || [], '.createdAt').at(0)
  }
}
