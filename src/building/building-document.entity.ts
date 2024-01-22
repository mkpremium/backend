import { Column, Entity, ManyToOne } from 'typeorm'
import { Building } from './building.entity'
import { BaseEntity } from '../infrastructure/entity'

export type BuildingDocumentMimeType = 'application/pdf' | 'image/jpeg'

@Entity()
export class BuildingDocument extends BaseEntity {
  @Column()
  name: string

  @Column()
  mimeType: BuildingDocumentMimeType

  @Column()
  previewUrl: string

  @Column()
  privateUrl: string

  @ManyToOne(() => Building, (building) => building.documents)
  building: Building
}
