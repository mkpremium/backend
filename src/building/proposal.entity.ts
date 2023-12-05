import { Entity, ManyToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Building } from './building.entity'

@Entity()
export class Proposal extends BaseEntity {
  @ManyToOne(() => Building, building => building.proposals)
  building: Building
}
