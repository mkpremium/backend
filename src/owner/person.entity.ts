import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { Contact } from '../contacts/contact.entity'
import { BaseEntity } from '../infrastructure/entity'
import { PersonContact } from './person-contact.entity'

@Entity()
export class Person extends BaseEntity {
  @Column('text')
  fullName: string

  @Column('text')
  firstName: string

  @Column('text')
  lastName?: string

  @Column('text', { unique: true, nullable: true })
  documentNumber?: string

  @OneToMany(() => PersonContact, oc => oc.person)
  contacts: PersonContact[]

  // TODO: add constrain in type
  @OneToOne(() => Contact, { nullable: true })
  @JoinColumn()
  featuredPhoneContact?: Contact

  // TODO: add constrain in type
  @OneToOne(() => Contact, { nullable: true })
  @JoinColumn()
  featuredEmailContact?: Contact
}
