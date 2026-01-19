import { Column, Entity, OneToOne } from 'typeorm'
import { Building } from './building.entity'
import { BaseEntity } from '../infrastructure/entity'

@Entity()
export class BuildingAddress extends BaseEntity {
    @Column()
    street: string

    @Column({ type: 'varchar' })
    number: string

    @Column()
    fullAddress: string

    @Column({ type: 'varchar', nullable: true })
    postalCode: string

    @Column({ type: 'boolean', nullable: true })
    postalCodeVerified: boolean

    @Column()
    city: string

    @Column()
    province: string

    @Column({ type: 'varchar', nullable: true })
    neighborhood: string

    @Column()
    type: string

    @OneToOne(() => Building, building => building.addressEntity)
    building: Building
}
