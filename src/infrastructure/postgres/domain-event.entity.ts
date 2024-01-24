import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum DomainEventCatalog {
  BUILDING__LEAD_CAPTURED = 'building.lead_captured',
  BUILDING__BUILDING_IMPORTED = 'building.building_imported',
  BUILDING__BUILDING_IMAGES_IMPORTED = 'building.building_images_imported',
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
  SCHEDULED_EVENTS__MEETING_CREATED = 'scheduled_events.meeting.created',

  USER__OPERATOR_ADDED = 'user.operator_added',

  WORKSHEET__INVALID_WORKSHEET_FOUND = 'worksheet.invalid_worksheet_found',
  WORKSHEET__NEXT_IN_QUEUE_TAKEN = 'worksheet.next_in_queue_taken',
  WORKSHEET__TAKEN = 'worksheet.taken',
  WORKSHEET__WORKSHEET_IMPORTED = 'worksheet.worksheet_imported',

  POSTGRES_MIGRATION__OWNER_IMPORTED = 'postgres_migration.owner_imported',

  // Commands, not events.
  CMD__POSTGRES__MIGRATION__IMPORT_BUILDING = 'postgres_migration.import_building',
  CMD__POSTGRES__MIGRATION__IMPORT_OPERATOR = 'postgres_migration.import_operator',
  CMD__POSTGRES__MIGRATION__IMPORT_OWNER = 'postgres_migration.import_owner',
  CMD__POSTGRES__MIGRATION__IMPORT_WORKSHEET = 'postgres_migration.import_worksheet',
  CMD__POSTGRES__MIGRATION__SAVE_DOCUMENTS = 'postgres.save_documents_command',
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
