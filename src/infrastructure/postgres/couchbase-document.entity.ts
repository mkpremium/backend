import { BaseEntity } from '../entity'
import { Column, Entity, Index } from 'typeorm'

export enum CouchbaseDocumentType {
  BUILDING = 'building',
  BUILDING_PROPOSAL = 'building-proposal',
  NOTE = 'note',
  METADATA = 'metadata',
  OPERATOR = 'operator',
  OWNER = 'owner',
  SCHEDULED_EVENT = 'scheduled-event',
  STOCK = 'stock',
  WORKSHEET = 'worksheet',
  WORKSHEET_QUEUE = 'worksheet-queue',

  BUILDING_OWNER_PHONE = 'building-owner-phone',
  BANK_FILE_DATA = 'bank-file-data',
  BANK_FILE = 'bank-file',
  CADASTRE_CACHE = 'cadastre-cache',
  HISTORY = 'history',
  OPERATOR_STATS = 'operator-stats',
  OWNER_OUTGOING_SMS = 'owner-outgoing-sms',
  PERSON = 'person',
  PORTUGAL_2021_OWNER_PHONE = 'portugal-2021-owner-phone',
  SYSTEM_PREFERENCES = 'system-preferences',
  VIRTUAL_AGENT_CALL = 'virtual-agent-call',
  VIRTUAL_CALL_WORKSHEET = 'virtual-call-worksheet',
  VIRTUAL_CALLER = 'virtual-caller',
  VIRTUAL_CALLER_PHONE = 'virtual-caller-phone',
  WORKSHEET_WO_BUILDINGS = 'worksheet-wo-buildings',
  PORTUGAL_2021_BUILDING = 'portugal-2021-building',

  CALLS = 'calls',
  CALLS_RAW_EVENTS = 'calls-raw-events',
  OPERATOR_REFRESH_TOKEN = 'operator-refresh_token',

  BANK_CITY_DATA = 'bank-city-data',
}

@Entity()
export class CouchbaseDocument extends BaseEntity {
  @Column({type: 'enum', enum: CouchbaseDocumentType})
  documentType: CouchbaseDocumentType

  @Column('jsonb')
  document: object

  @Column('timestamp', {nullable: true})
  @Index()
  migratedAt: Date

  @Column('text', {default: 'current'})
  fromCouchbase: string
}
