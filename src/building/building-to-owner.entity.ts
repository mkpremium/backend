import { Entity, ManyToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity';
import { Building } from './building.entity'
import { Owner } from '../owner/owner.entity'

@Entity()
export class BuildingToOwner extends BaseEntity {
  @ManyToOne(() => Building, building => building.owners)
  building: Building

  @ManyToOne(() => Owner, owner => owner.buildings)
  owner: Owner
}
