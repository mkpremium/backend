import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Worksheet } from './worksheet.entity'
import { QueueSource } from './domain/queue'

@Entity()
export class WorksheetQueue extends BaseEntity {
  @Column()
  name: string

  @OneToMany(() => Worksheet, ws => ws.queue)
  worksheets: Worksheet[]

  @Column('jsonb')
  source: QueueSource
}
