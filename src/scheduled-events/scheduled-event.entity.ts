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

  @Column('text', { nullable: false })
    type: 'MEETING' | 'CALL'

  @ManyToOne(() => User, { nullable: false })
    notifyTo: User

  @ManyToOne(() => User, { nullable: false })
    createdBy: User

  @ManyToOne(() => Building, { nullable: false })
    building: Building

  @ManyToOne(() => Owner, { nullable: false })
    owner: Owner

  @ManyToOne(() => Contact, { nullable: false })
    contact: Contact
}
