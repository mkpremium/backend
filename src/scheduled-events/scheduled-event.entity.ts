import { Column, Entity, ManyToOne } from 'typeorm'
import { Building } from '../building/building.entity'
import { BaseEntity } from '../infrastructure/entity'
import { Owner } from '../owner/owner.entity'
import { User } from '../user/user.entity'
import { Contact } from '../contacts/contact.entity'

@Entity()
export class ScheduledEvent extends BaseEntity {
  @Column('timestamp')
  scheduledFor: Date

  @ManyToOne(() => User)
  notifyTo: User

  @ManyToOne(() => User)
  createdBy: User

  @ManyToOne(() => Building)
  building: Building

  @ManyToOne(() => Owner)
  owner: Owner

  @ManyToOne(() => Contact)
  contact: Contact
}
