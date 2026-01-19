import { Column, Entity, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { WorksheetQueue } from './worksheet-queue.entity'

@Entity()
export class WorksheetQueueSource extends BaseEntity {
    @Column('text', { array: true })
    provinces: string[]

    @Column({ nullable: true })
    city?: string

    @Column({ nullable: true })
    zone?: string

    @Column({ nullable: true })
    neighborhood?: string

    @OneToOne(() => WorksheetQueue, worksheetQueue => worksheetQueue.sourceEntity)
    worksheetQueue: WorksheetQueue
}
