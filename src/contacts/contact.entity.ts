import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { ContactType } from '../owner/owner'
import { BuildingLead } from '../building/building-lead.entity'
import { CallQueue } from '../retell/call-queue.entity'

@Entity()
export class Contact extends BaseEntity {
  @Column({ unique: true })
  value: string

  @Column('text')
  type: ContactType

  @OneToMany(() => BuildingLead, lead => lead.contact)
  leads:BuildingLead[]

  @OneToMany(() => CallQueue, callQueue => callQueue.contact)
  callQueues?: CallQueue[]
}
