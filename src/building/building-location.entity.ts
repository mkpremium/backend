import { Column, Entity, OneToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from './building.entity'

@Entity()
export class BuildingLocation extends BaseEntity {
    @Column({ type: 'double precision' })
    lat:number

    @Column({ type: 'double precision' })
    lng:number

    @OneToOne(() => Building, building => building.locationEntity)
    building: Building
}
