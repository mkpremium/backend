import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { PersonContact } from './owner-contact.entity'

@Entity()
export class Person extends BaseEntity {
  @Column('text')
  firstName: string

  @Column('text')
  lastName?: string

  @Column('text', { unique: true, nullable: true })
  documentNumber?: string

  @OneToMany(() => PersonContact, oc => oc.owner)
  contacts: PersonContact[]
}
