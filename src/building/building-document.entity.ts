import { Column, Entity, ManyToOne } from 'typeorm'
import { Building } from './building.entity'
import { BaseEntity } from '../infrastructure/entity'

@Entity()
export class BuildingDocument extends BaseEntity {
  @Column()
  name: string

  @Column()
  mimeType: string // TODO: specify existing types

  @Column()
  previewUrl: string

  @Column()
  privateUrl: string

  @ManyToOne(() => Building, (building) => building.documents)
  building: Building
}
