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

/**
 * @swagger
 * definitions:
 *   WorksheetListQuery:
 *     properties:
 *       date:
 *         type: string
 *         format: dd-MM-YYYY
 */
t.WorksheetListQuery = t.ListQuery.extend(
  {
    status: t.maybe(t.WorkSheetStatus)
  },
  {
    name: 'WorksheetListQuery',
    defaultProps: {
      dateRange: []
    }
  }
);

t.WorksheeQueueListQuery = t.ListQuery.extend({
  status: t.maybe(t.WorkSheetQueueStatus),
  operatorId: t.maybe(t.String),
  date: t.maybe(t.String),
  dateRange: t.list(t.String)
});
