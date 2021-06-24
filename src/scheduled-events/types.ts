import t from 'tcomb'
import { OwnerWithInclude } from '../owner/owner'
import { DateTimeString } from '../infrastructure/shared-types'
import exp from 'constants'

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
}

export const ScheduledEventTypeEnum = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType')

export const Event = t.struct(
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
      _documentType: 'scheduled-event',
      event: {},
      get createdAt () {
        return new Date()
      }
    }
  }
)

export default t

interface EventProps {
  ownerId: string;
  contactId: string;
  buildingId: string;
  worksheetId: string;
  inPerson?: boolean
}

interface MeetingEventProps extends EventProps {
  inPerson: true
}
interface OfferRequestEventProps extends EventProps {
  inPerson: false
}

export interface ScheduledEventProps {
  id: string;
  type: 'CALLS' | 'MEETINGS';
  notifyTo: string;
  eventDate: Date | string;
  createdAt: Date;
  createdBy: string;
  _documentType: 'scheduled-event'
  event: EventProps
}

export interface MeetingProps extends ScheduledEventProps {
  event: MeetingEventProps
}

export interface OfferRequestProps extends ScheduledEventProps {
  event: OfferRequestEventProps
}

