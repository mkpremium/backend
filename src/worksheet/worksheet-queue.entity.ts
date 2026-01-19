import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Worksheet } from './worksheet.entity'
import { UserProfile } from '../user/user-profile.entity'
import { WorksheetQueueSource } from './worksheet-queuesource.entity'
import { QueueSource } from './domain/queue'

@Entity()
export class WorksheetQueue extends BaseEntity {
  @Column()
  name: string

  @Column('jsonb')
  source: QueueSource

  @OneToMany(() => Worksheet, ws => ws.queue)
  worksheets: Worksheet[]

  @OneToMany(() => UserProfile, userProfile => userProfile.worksheetQueue)
  userProfiles: WorksheetQueue[]

  @OneToOne(() => WorksheetQueueSource, queueSource => queueSource.worksheetQueue)
  @JoinColumn({ name: 'sourceId' })
  sourceEntity: WorksheetQueueSource
}
