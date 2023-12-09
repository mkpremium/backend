import { BaseEntity } from '../infrastructure/entity'
import { Column, Entity, ManyToOne } from 'typeorm'
import { Contact } from '../contacts/contact.entity'
import { OwnerContactStatus } from './owner'
import { Person } from './person.entity'

// TODO: rename file to match class name.
@Entity()
export class PersonContact extends BaseEntity {
  @ManyToOne(() => Person)
  owner: Person

  @ManyToOne(() => Contact)
  contact: Contact

  @Column('text')
  status: OwnerContactStatus
}
