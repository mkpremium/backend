import t from 'tcomb'
import { isMaybeTesting } from '../../config'
import { Building } from '../building/building'
import { OwnerWithInclude } from '../owner/owner'

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
}

t.ScheduledEventType = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType')

const Event = t.struct(
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

export const ScheduleTaskType = {
  UPDATE_BUILDING: 'update-building'
}

t.ScheduleTaskType = t.enums.of(Object.values(ScheduleTaskType))

export const ScheduledEvent = t.struct(
  {
    id: t.maybe(t.String),
    type: t.ScheduledEventType,
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

t.ScheduleEventsListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(ScheduledEvent)
  },
  {
    name: 'ScheduleEventsListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

t.UpdateScheduledEvent = t.struct({
  notifyAt: t.maybe(t.Date),
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event)
}, 'UpdateScheduledEvent')

t.ScheduledEventListQuery = t.ListQuery.extend(
  {
    createdBy: t.maybe(t.String),
    notifyAt: t.maybe(t.String),
    type: t.maybe(t.ScheduledEventType),
    createdAt: t.maybe(t.String),
    eventDate: t.maybe(t.String),
    eventDateBetween: t.maybe(t.String),
    createdBetween: t.maybe(t.StringSplitList),
    notifyBetween: t.maybe(t.StringSplitList)
  },
  {
    name: 'ScheduledEventListQuery',
    defaultProps: {
      createdBetween: ',',
      notifyBetween: ',',
      eventDateBetween: ','
    }
  }
)

t.Meeting = t.struct({
  owner: isMaybeTesting(t.Object),
  notifyTo: t.String,
  address: t.maybe(t.String),
  contact: isMaybeTesting(t.struct({
    name: t.String,
    email: t.maybe(t.String),
    phone: t.maybe(t.String)
  }, 'contact')),
  id: t.String,
  building: isMaybeTesting(Building),
  createdAt: t.Date,
  eventDate: t.Date,
  inPerson: t.Boolean,
  createdBy: isMaybeTesting(t.String)
}, 'Meeting')

export default t
