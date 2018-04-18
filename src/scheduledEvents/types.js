import t from 'tcomb';
import {isMaybeTesting} from '../../config';

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
};

t.ScheduledEventType = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType');

/**
 * @swagger
 * definitions:
 *   ScheduledCallEventBody:
 *     properties:
 *       notifyTo:
 *        type: string
 *        format: uuid/v4
 *        description: Id del operador a notificar
 *       event:
 *         type: object
 *         $ref: "#/definitions/ScheduledCallEvent"
 *         description: Contexto de la llamada
 *       notifyAt:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *         description: Fecha de envío de la notificación
 *       eventDate:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *         description: Fecha de la cita
 */

/**
 * @swagger
 * definitions:
 *   ScheduledMeetingEventBody:
 *     properties:
 *       createdBy:
 *        type: string
 *        format: uuid/v4
 *        description: Id del operador que crea la cita
 *       notifyTo:
 *        type: string
 *        format: uuid/v4
 *        description: Id del operador a notificar
 *       event:
 *         type: object
 *         $ref: "#/definitions/ScheduledMeetingEvent"
 *         description: Contexto de la cita
 *       notifyAt:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *         description: Fecha de envío de la notificación
 *       eventDate:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *         description: Fecha de la cita
 */

/**
 * @swagger
 * definitions:
 *   ScheduledEvent:
 *     properties:
 *       id:
 *        type: string
 *        format: uuid/v4
 *       createdBy:
 *        type: string
 *        format: uuid/v4
 *       notifyTo:
 *        type: string
 *        format: uuid/v4
 *       event:
 *        type: object
 *        description: Puede contener ScheduledCallEvent o ScheduledMeetingEvent
 *       type:
 *         type: string
 *         enum: [CALLS, MEETINGS]
 *       notifyAt:
 *         type: string
 *         description: YYYY-MM-DDTHH:MM:SSZ
 *       eventDate:
 *         type: string
 *         description: YYYY-MM-DDTHH:MM:SSZ
 *       createdAt:
 *         type: string
 *         description: YYYY-MM-DD
 */
const Event = t.struct({
  ownerId: t.maybe(t.String),
  contactId: t.maybe(t.String),
  worksheetId: t.maybe(t.String),
  buildingId: t.maybe(t.String),
  eventAddress: t.maybe(t.String),
  eventLocation: t.maybe(t.struct({
    lat: t.Number,
    long: t.Number
  }, 'eventLocation'))
}, 'event');
t.ScheduledEvent = t.struct(
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
      get createdAt() {
        return new Date();
      }
    }
  }
);

/**
 * @swagger
 * definitions:
 *   ScheduledCallEvent:
 *     properties:
 *       ownerId:
 *        type: string
 *        format: uuid/v4
 *       contactId:
 *        type: string
 *        format: uuid/v4
 *       worksheetId:
 *        type: string
 *        format: uuid/v4
 */

/**
 * @swagger
 * definitions:
 *   ScheduledMeetingEventLocation:
 *     properties:
 *       lat:
 *         type: number
 *       long:
 *         type: number
 *   ScheduledMeetingEvent:
 *     properties:
 *       contactId:
 *         type: string
 *         format: uuid/v4
 *       ownerId:
 *         type: string
 *         format: uuid/v4
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *       worksheetId:
 *         type: string
 *         format: uuid/v4
 *       eventAddress:
 *         type: string
 *       eventLocation:
 *         type: object
 *         $ref: "#/definitions/ScheduledMeetingEventLocation"
 */

/**
 * @swagger
 * definitions:
 *   ScheduleEventsListResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/ScheduledEvent"
 */
t.ScheduleEventsListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.ScheduledEvent)
  },
  {
    name: 'ScheduleEventsListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
);

/**
 * @swagger
 * definitions:
 *   UpdateScheduledEvent:
 *     properties:
 *       type:
 *         type: string
 *         enum: [CALLS, MEETINGS]
 *       notifyAt:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 */
t.UpdateScheduledEvent = t.struct({
  type: t.maybe(t.ScheduledEventType),
  notifyTo: t.String,
  notifyAt: t.maybe(t.Date),
  eventDate: t.maybe(t.Date),
  event: Event
}, 'UpdateScheduledEvent');

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
);

t.Meeting = t.struct({
  owner: isMaybeTesting(t.Object),
  notifyTo: t.String,
  address: isMaybeTesting(t.String),
  contact: isMaybeTesting(t.struct({
    name: t.String,
    email: t.maybe(t.String),
    phone: t.maybe(t.String)
  }, 'contact')),
  id: t.String,
  building: isMaybeTesting(t.Building),
  createdAt: t.Date,
  eventDate: t.Date,
  createdBy: isMaybeTesting(t.String)
}, 'Meeting');
