import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Owner } from '../owner/owner.entity'
import { Building } from '../building/building.entity'
import { Contact } from '../contacts/contact.entity'

@Entity({ name: 'call_queue' })
export class CallQueue {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column('uuid')
  owner_id?: string

  @Column('uuid')
  building_id?: string

  @Column('uuid')
  contact_id?: string

  @Column({ type: 'boolean', default: true })
  can_call?: boolean

  @Column({ type: 'timestamp', nullable: true })
  freeze_until?: Date

  @Column({ name: 'call_count', type: 'int', default: () => '0' })
  callCount?: number

  @Column({ name: 'max_attempts', type: 'int', default: () => '3' })
  maxAttempts?: number

  @Column({ name: 'last_called_at', type: 'timestamp', nullable: true })
  lastCalledAt?: Date

  @Column({ type: 'varchar', length: 20 })
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
