import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { WorksheetStatusType } from './domain/worksheet'
import { Building } from '../building/building.entity'
import { WorksheetQueue } from './worksheet-queue.entity'
import { User } from '../user/user.entity'
import { Caller } from '../caller/caller.entity'
import { BuildingLead } from '../building/building-lead.entity'

@Entity()
export class Worksheet extends BaseEntity {
  @Column({ type: 'text', default: 'LOOKING_MEETING' })
  status: WorksheetStatusType

  @OneToOne(() => Building, building => building.worksheet)
  @JoinColumn()
  building: Building

  @ManyToOne(() => WorksheetQueue, wq => wq.worksheets)
  queue?: WorksheetQueue

  @ManyToOne(() => Caller, { nullable: true })
  heldBy?: Caller

  @Column({ type: 'text', default: '' })
  statusChangeReason?: string

  @Column({ type: 'timestamptz', nullable: true })
  lastStatusChangedAt?: Date

  @Column({ type: 'timestamptz', nullable: true })
  lastViewedAt?: Date

  @ManyToOne(() => User, { nullable: true })
  lastViewedBy?: User

  @OneToOne(() => BuildingLead, (lead) => lead.worksheet)
  lead: BuildingLead
  // lastMeeting
}
