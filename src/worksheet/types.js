import t from 'tcomb';

/**
 * @swagger
 * definitions:
 *   QueueRequestParams:
 *     required:
 *       - queueItemId
 *     properties:
 *       queueItemId:
 *         description: Id del item de la cola *
 *         type: string
 *         format: uuid/v4
 */

t.QueueRequestParams = t.struct({
  queueItemId: t.String
}, 'QueueRequest');

t.WorksheetListQuery = t.ListQuery.extend(
  {
    status: t.maybe(t.WorkSheetStatus),
    viewedAt: t.maybe(t.String),
    viewedBetween: t.list(t.String)
  },
  {
    name: 'WorksheetListQuery',
    defaultProps: {
      viewedBetween: []
    }
  }
);

t.WorksheeQueueListQuery = t.ListQuery.extend({
  status: t.maybe(t.WorkSheetQueueStatus),
  operatorId: t.maybe(t.String),
  date: t.maybe(t.String),
  dateRange: t.list(t.String)
});
