import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { ContactType } from '../owner/owner'
import { BuildingLead } from '../building/building-lead.entity'

@Entity()
export class Contact extends BaseEntity {
  @Column({ unique: true })
  value: string

  @Column('text')
  type: ContactType

  @OneToMany(() => BuildingLead, lead => lead.contact)
  leads:BuildingLead[]
}
