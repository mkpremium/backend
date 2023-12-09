import { BaseEntity } from '../infrastructure/entity'
import { Column, Entity, ManyToOne } from 'typeorm'
import { Contact } from '../contacts/contact.entity'
import { OwnerContactStatus } from './owner'
import { Person } from './person.entity'

@Entity()
export class PersonContact extends BaseEntity {
  @ManyToOne(() => Person)
  person: Person

  @ManyToOne(() => Contact)
  contact: Contact

  @Column('text')
  status: OwnerContactStatus
}
