import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { User } from './user.entity'
import { BaseEntity } from '../infrastructure/entity'
import { WorksheetQueue } from '../worksheet/worksheet-queue.entity'

@Entity()
export class UserProfile extends BaseEntity {
    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({ nullable: true })
    city: string

    @Column({ nullable: true })
    email: string

    @Column({ type: 'enum', enum: ['es', 'pt'], enumName: 'language_type', default: 'es' })
    language: 'es' | 'pt'

    @ManyToOne(() => WorksheetQueue, worksheetQueue => worksheetQueue.userProfiles)
    @JoinColumn({ name: 'queueId' })
    worksheetQueue: WorksheetQueue

    @OneToOne(() => User, user => user.profileEntity)
    user: User
}
