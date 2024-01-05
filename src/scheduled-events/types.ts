import t from 'tcomb'
import { OwnerWithInclude } from '../owner/owner'
import { DateTimeString } from '../infrastructure/shared-types'
import { CouchbaseDocumentType } from '../infrastructure/postgres/couchbase-document.entity'

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
}

export const ScheduledEventTypeEnum = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType')

export const Event = t.struct<EventProps>(
  {
    owner: t.maybe(OwnerWithInclude),
    ownerId: t.String,
    queueId: t.maybe(t.String),
    itemId: t.maybe(t.String),
    contactId: t.String,
    worksheetId: t.maybe(t.String),
    buildingId: t.maybe(t.String),
    eventAddress: t.maybe(t.String),
    eventLocation: t.maybe(t.struct({
      lat: t.Number,
      long: t.Number
    }, 'eventLocation')),
    inPerson: t.Boolean
  },
  {
    name: 'event',
    defaultProps: {
      inPerson: true
    }
  })

export const ScheduledEvent = t.struct<ScheduledEventProps>(
  {
    id: t.maybe(t.String),
    type: ScheduledEventTypeEnum,
    notifyTo: t.String,
    eventDate: t.union([ t.Date, DateTimeString ]),
    createdAt: t.union([ t.Date, DateTimeString ]),
    createdBy: t.maybe(t.String),
    _documentType: t.String,
    event: Event
  },
  {
    name: 'ScheduledEvent',
    defaultProps: {
      _documentType: CouchbaseDocumentType.SCHEDULED_EVENT,
      event: {},
      get createdAt () {
        return new Date()
      }
    }
  }
)

interface EventProps {
  ownerId: string;
  contactId: string;
  buildingId: string;
  worksheetId?: string;
  inPerson?: boolean
}

export type ScheduledEventId = string & { _kind: 'ScheduledEventId' }

export interface ScheduledEventProps {
  id: ScheduledEventId;
  type: 'CALLS' | 'MEETINGS';
  notifyTo: string;
  eventDate: Date | string;
  createdAt: Date;
  createdBy: string;
  _documentType: 'scheduled-event'
  event: EventProps
}

export interface MeetingProps extends ScheduledEventProps {
  type: 'MEETINGS'
  event: EventProps & { inPerson: true }
}

export interface CallScheduledProps extends ScheduledEventProps {
  type: 'CALLS'
  event: EventProps & { inPerson: false }
}
