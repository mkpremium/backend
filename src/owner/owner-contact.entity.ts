import { BaseEntity } from '../infrastructure/entity'
import { Column, Entity, ManyToOne } from 'typeorm'
import { Owner } from './owner.entity'
import { Contact } from '../contacts/contact.entity'
import { OwnerContactStatus } from './owner'

@Entity()
export class OwnerContact extends BaseEntity {
  @ManyToOne(() => Owner)
  owner: Owner

  @ManyToOne(() => Contact)
  contact: Contact

  @Column('text')
  status: OwnerContactStatus
}
