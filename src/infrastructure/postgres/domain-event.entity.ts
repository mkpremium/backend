import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum DomainEventCatalog {
  BUILDING__LEAD_CAPTURED = 'building.lead_captured',
  BUILDING__BUILDING_IMPORTED = 'building.building_imported',
  BUILDING__NEGOTIATION_STATUS_CHANGED = 'building.negotiation_status_changed',
  BUILDING__PROPOSAL_SCHEDULED = 'building.proposal_scheduled',

  OFFER_REQUEST__CREATED = 'offer_request.created',

  OWNER__ADDED = 'owner.owner_added',
  OWNER__CONTACT_ADDED = 'owner.contact_added',
  OWNER__CONTACT_STATUS_CHANGED = 'owner.contact_status_changed',
  OWNER__STATUS_CHANGED = 'owner.status_changed',

  SCHEDULED_EVENTS__CALL_SCHEDULED = 'scheduled_events.call_scheduled',
  SCHEDULED_EVENTS__CALL_UPDATED = 'scheduled_events.call_updated',
  SCHEDULED_EVENTS__EVENT_DELETED = 'scheduled_events.event_deleted',

  USER__OPERATOR_ADDED = 'user.operator_added',

  WORKSHEET__INVALID_WORKSHEET_FOUND = 'worksheet.invalid_worksheet_found',
  WORKSHEET__NEXT_IN_QUEUE_TAKEN = 'worksheet.next_in_queue_taken',
  WORKSHEET__TAKEN = 'worksheet.taken',
}

@Entity()
export class DomainEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text')
  name: DomainEventCatalog

  @Column({ default: 'unknwon' })
  version: String

  @Column({
    type: 'jsonb'
  })
  body: object

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
