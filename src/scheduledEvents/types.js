import t from 'tcomb';

export const ScheduledEventType = {
  CALLS: 'CALLS',
  MEETINGS: 'MEETINGS'
};

t.ScheduledEventType = t.enums.of(Object.values(ScheduledEventType), 'ScheduledEventType');

/**
 * @swagger
 * definitions:
 *  ScheduledEvent:
 *    properties:
 *      id:
 *        type: string
 *        format: uuid/v4
 *      userId:
 *        type: string
 *        format: uuid/v4
 *      type:
 *        $ref: "#/definitions/ScheduledEventType"
 *      data:
 *        type: object
 *      notifyAt:
 *        type: string
 *        format: YYYY-MM-DDTHH:MM:SSZ
 */
t.ScheduledEvent = t.struct(
  {
    id: t.maybe(t.String),
    userId: t.maybe(t.String),
    type: t.ScheduledEventType,
    data: t.Object,
    notifyAt: t.String,
    date: t.Date,
    _documentType: t.String
  },
  {
    name: 'ScheduledEvent',
    defaultProps: {
      _documentType: 'scheduledEvent',
      get date() {
        return new Date();
      }
    }
  }
);

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
 *         $ref: "#/definitions/ScheduledEventType"
 *       data:
 *         type: object
 *       notifyAt:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 */

t.UpdateScheduledEvent = t.struct({
  type: t.maybe(t.ScheduledEventType),
  data: t.maybe(t.Object),
  notifyAt: t.maybe(t.String)
}, 'UpdateScheduledEvent');

t.ScheduledEventListQuery = t.ListQuery.extend(
  {
    userId: t.maybe(t.String),
    notifyAt: t.maybe(t.String),
    createdAt: t.maybe(t.String),
    createdBetween: t.maybe(t.StringSplitList),
    notifyBetween: t.maybe(t.StringSplitList)
  },
  {
    name: 'ScheduledEventListQuery',
    defaultProps: {
      createdBetween: ',',
      notifyBetween: ','
    }
  }
);
