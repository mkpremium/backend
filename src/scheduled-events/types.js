import t from 'tcomb'
import { OwnerWithInclude } from '../owner/owner'

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
}

export const ScheduledEventTypeEnum = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType')

export const Event = t.struct(
  {
    owner: t.maybe(OwnerWithInclude),
    ownerId: t.maybe(t.String),
    queueId: t.maybe(t.String),
    itemId: t.maybe(t.String),
    contactId: t.maybe(t.String),
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

export const ScheduledEvent = t.struct(
  {
    id: t.maybe(t.String),
    type: ScheduledEventTypeEnum,
    notifyTo: t.String,
    notifyAt: t.Date,
    eventDate: t.Date,
    createdBy: t.maybe(t.String),
    createdAt: t.Date,
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
