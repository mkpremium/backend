import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { ContactStatus, ContactType } from '../owner/owner'

@Entity()
export class Contact extends BaseEntity {
  @Column()
  value: string

  @Column('text')
  type: ContactType

  @Column('text')
  status: ContactStatus
}
