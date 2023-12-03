import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { WorksheetStatusType } from './domain/worksheet'
import { Building } from '../building/building.entity'
import { WorksheetQueue } from './worksheet-queue.entity'
import { User } from '../user/user.entity'

@Entity()
export class Worksheet extends BaseEntity {
    @Column({ type: 'text', default: 'LOOKING_MEETING' })
    status: WorksheetStatusType

    @OneToOne(() => Building, building => building.worksheet)
    @JoinColumn()
    building: Building

    @ManyToOne(() => WorksheetQueue, wq => wq.worksheets)
    queue: WorksheetQueue

    @Column({ type: 'text', default: '' })
    statusChangeReason?: string

    @Column({ type: 'timestamptz' })
    lastStatusChangedAt: Date

    @Column({ type: 'timestamptz' })
    lastViewedAt: Date

    @ManyToOne(() => User)
    lastViewedBy: User

    // lastMeeting
}
