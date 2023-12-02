import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import {
  BuildingAddressProps,
  BuildingLocation,
  BuildingNegotiationStatus,
  Lead,
  ProposalProps,
  proposalSent
} from './building'
import { BuildingImage } from './building-image.entity'
import { BaseEntity } from '../infrastructure/entity'
import { Owner } from '../owner/owner.entity'
import { Flipper } from '../flipper/flipper.entity'
import { DealProposal } from './deal-proposal.entity'
import _ from 'lodash'


@Entity()
export class Building extends BaseEntity {
  @Column('jsonb')
  address: BuildingAddressProps

  @Column()
  negotiationStatus: BuildingNegotiationStatus

  @Column({ type: 'jsonb', nullable: true })
  lead?: Lead

  @ManyToOne(() => Owner, owner => owner.featuredInBuildings, { nullable: true })
  featuredOwner?: Owner

  @ManyToOne(() => Flipper, flipper => flipper.assignedBuildings)
  assignedFlipper?: Flipper

  @Column({ type: 'float', nullable: true })
  floorArea: number

  @Column({ nullable: true })
  publicIdentifier?: string

  @Column({ type: 'jsonb', nullable: true })
  location?: BuildingLocation

  @Column({ nullable: true })
  use?: string

  @OneToMany(() => DealProposal, proposal => proposal.building)
  proposals?: DealProposal[]

  @OneToMany(() => BuildingImage, image => image.building)
  images: BuildingImage[]

  get recentProposal () {
    return _.sortBy(this.proposals || [], '.createdAt').at(-1)
  }
}
