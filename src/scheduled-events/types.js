import t from 'tcomb'
import moment from 'moment'

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
}

const ScheduledEventTypeEnum = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType')

export const Event = t.struct(
  {
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

const DateTimeString = t.refinement(t.String, s => moment(s, 'YYYY-MM-DD[T]HH:mm:ss.SSSZ', true).isValid())
export const ScheduledEvent = t.struct(
  {
    id: t.maybe(t.String),
    type: ScheduledEventTypeEnum,
    notifyTo: t.String,
    notifyAt: t.Date,
    eventDate: t.union([ t.Date, DateTimeString ]),
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
