import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { CallQueue } from './call-queue.entity'

@Entity({ name: 'call_logs' })
@Index('idx_call_logs_created_at', ['createdAt'])
@Index('idx_call_logs_call_id', ['callId'])
@Index('idx_call_logs_client_id', ['clientId'])
@Index('idx_call_logs_agent_id', ['agentId'])
@Index('idx_call_logs_from_number_norm', ['fromNumberNorm'])
@Index('idx_call_logs_to_number_norm', ['toNumberNorm'])
export class CallLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'time with time zone', name: 'start_time' })
  startTime?: Date

  @Column({ type: 'text', nullable: true })
  duration?: string

  @Column({ type: 'text', name: 'to_number', nullable: true })
  toNumber?: string

  @Column({ type: 'text', nullable: true })
  summary?: string

  @Column({ type: 'text', nullable: true })
  transcript?: string

  @Column({ type: 'text', name: 'end_reason', nullable: true })
  endReason?: string

  @Column({ type: 'text', nullable: true })
  recordings?: string

  @Column({ type: 'text', name: 'call_id', nullable: true })
  callId?: string

  @Column({ type: 'text', nullable: true })
  interest?: string

  @Column({ type: 'text', name: 'tipo_vivienda', nullable: true })
  tipoVivienda?: string

  @Column({ type: 'text', nullable: true })
  status?: string

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  ownerId?: string

  @Column({ type: 'text', nullable: true })
  cost?: string

  @Column({ type: 'text', name: 'from_number', nullable: true })
  fromNumber?: string

  @Column({ type: 'text', name: 'from_number_norm', nullable: true })
  fromNumberNorm?: string

  @Column({ type: 'text', name: 'to_number_norm', nullable: true })
  toNumberNorm?: string

  @Column({ type: 'text', nullable: true })
  name?: string

  @Column({ type: 'text', name: 'agent_id', nullable: true })
  agentId?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Column({ type: 'text', nullable: true })
  provincia?: string

  @Column({ type: 'uuid', name: 'building_id', nullable: true })
  buildingId?: string

  @Column({ type: 'uuid', name: 'contact_id', nullable: true })
  contactId?: string

  @Column({ type: 'text', name: 'resumen' })
  resumen?: string

  @Column({ type: 'boolean', name: 'call_successful' })
  callSuccessful?: boolean

  @Column({ type: 'boolean', name: 'vende' })
  vende?: boolean

  @Column({ type: 'boolean', name: 'no_llamar' })
  noLlamar?: boolean

  @Column({ type: 'boolean', name: 'rellamada' })
  rellamada?: boolean

  @Column({ type: 'uuid', name: 'call_queue_id' })
  callQueueId?: string

  @Column({ type: 'text', name: 'client_id', default: 'elevate_003' })
  clientId?: string

  @ManyToOne(() => CallQueue, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'call_queue_id' })
  callQueue?: CallQueue
}
