import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { BuildingAddressProps, BuildingLocation, BuildingNegotiationStatus, Lead } from './building'
import { BuildingDocument } from './building-document.entity'
import { BaseEntity } from '../infrastructure/entity'
import { Owner } from '../owner/owner.entity'
import { Flipper } from '../flipper/flipper.entity'
import { Proposal } from './proposal.entity'
import _ from 'lodash'
import { Worksheet } from '../worksheet/worksheet.entity'
import { BuildingNote } from './building-note.entity'

@Entity()
export class Building extends BaseEntity {
  @Column('jsonb')
  address: BuildingAddressProps

  @Column({ default: 'PENDIENTE' })
  negotiationStatus: BuildingNegotiationStatus

  @Column({ type: 'jsonb', nullable: true })
  lead?: Lead

  @ManyToOne(() => Owner, owner => owner.featuredInBuildings, { nullable: true })
  featuredOwner?: Owner

  @ManyToOne(() => Flipper, flipper => flipper.assignedBuildings)
  assignedFlipper?: Flipper

  @Column({ type: 'float', nullable: true })
  floorArea: number

  // Spanish "Referencia Catastral". It's a unique identifier for a building.
  @Column({ nullable: true, unique: true })
  publicIdentifier?: string

  @Column({ type: 'jsonb', nullable: true })
  location?: BuildingLocation

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

  get recentProposal (): Proposal | undefined {
    return _.sortBy(this.proposals || [], '.createdAt').at(-1)
  }
}
