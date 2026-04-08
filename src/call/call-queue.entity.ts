import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Owner } from '../owner/owner.entity'
import { Building } from '../building/building.entity'
import { Contact } from '../contacts/contact.entity'

@Entity({ name: 'call_queue' })
export class CallQueue {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId?: string

  @Column({ name: 'building_id', type: 'uuid' })
  buildingId?: string

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId?: string

  @Column({ name: 'can_call', type: 'boolean', default: true })
  canCall?: boolean

  @Column({ name: 'freeze_until', type: 'timestamp', nullable: true })
  freezeUntil?: Date

  @Column({ name: 'call_count', type: 'int', default: () => '0' })
  callCount?: number

  @Column({ name: 'max_attempts', type: 'int', default: () => '3' })
  maxAttempts?: number

  @Column({ name: 'last_called_at', type: 'timestamp', nullable: true })
  lastCalledAt?: Date

  @Column({ name: 'freeze_type', type: 'varchar', length: 20, nullable: true })
  freezeType?: string

  // Relaciones
  @ManyToOne(() => Owner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner?: Owner

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building?: Building

  @ManyToOne(() => Contact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact
}
