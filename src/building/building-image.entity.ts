import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Building } from './building.entity'
import { BaseEntity } from '../infrastructure/entity'

@Entity()
export class BuildingImage extends BaseEntity {
  @Column()
  name: string

  @Column()
  mimeType: string

  @Column()
  previewUrl: string

  @ManyToOne(() => Building, (building) => building.images)
  building: Building
}
