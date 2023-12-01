import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum DomainEventCatalog {
  BUILDING__NEGOTIATION_STATUS_CHANGED = 'building.negotiation_status_changed',
  SCHEDULED_EVENTS__EVENT_DELETED = 'scheduled_events.event_deleted',
  OWNER__CONTACT_STATUS_CHANGED = 'owner.contact_status_changed',
  WORKSHEET__TAKEN = 'worksheet.taken',
  BUILDING__PROPOSAL_SCHEDULED = 'building.proposal_scheduled',
  SCHEDULED_EVENTS__CALL_SCHEDULED = 'scheduled_events.call_scheduled',
  SCHEDULED_EVENTS__CALL_UPDATED = 'scheduled_events.call_updated',
  OWNER__STATUS_CHANGED = 'owner.status_changed',
  WORKSHEET__NEXT_IN_QUEUE_TAKEN = 'worksheet.next_in_queue_taken',
  OFFER_REQUEST__CREATED = 'offer_request.created',
}

@Entity()
export class DomainEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'enum',
    enum: DomainEventCatalog,
  })
  name: DomainEventCatalog

  @Column({
    type: 'jsonb'
  })
  body: object

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
