import { Column, Entity, JoinColumn, OneToOne, ManyToOne } from 'typeorm'
import { Building } from './building.entity'
import { Worksheet } from '../worksheet/worksheet.entity'
import { Contact } from '../contacts/contact.entity'
import { Owner } from '../owner/owner.entity'
import { BaseEntity } from '../infrastructure/entity'

@Entity()
export class BuildingLead extends BaseEntity {
    @OneToOne(() => Worksheet, worksheet => worksheet.lead)
    @JoinColumn()
    worksheet: Worksheet

    @OneToOne(() => Building, building => building.leadEntity)
    building: Building

    @ManyToOne(() => Owner, owner => owner.leads)
    owner: Owner

    @ManyToOne(() => Contact, contact => contact.leads)
    contact: Contact

    @Column()
    capturedAt:Date
}
