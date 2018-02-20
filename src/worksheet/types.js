import t from 'tcomb';

export const QueueRequestAction = {
  TAKE: 'TAKE',
  RELEASE: 'RELEASE'
};

t.QueueRequestAction = t.enums(QueueRequestAction);

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
 *       action:
 *         description: Acción a realizar en el item
 *         type: string
 *         default: open
 */

t.QueueRequestParams = t.struct(
  {
    queueItemId: t.String,
    action: t.maybe(t.QueueRequestAction)
  },
  {
    name: 'QueueRequest',
    defaultProps: {
      action: QueueRequestAction.TAKE
    }
  }
);

t.WorksheetListQuery = t.ListQuery.extend(
  {
    status: t.maybe(t.WorkSheetStatus),
    viewedAt: t.maybe(t.String),
    viewedBetween: t.maybe(t.StringSplitList)
  },
  {
    name: 'WorksheetListQuery',
    defaultProps: {
      viewedBetween: ','
    }
  }
);

t.WorksheeQueueListQuery = t.ListQuery.extend({
  status: t.maybe(t.WorkSheetQueueStatus),
  operatorId: t.maybe(t.String),
  date: t.maybe(t.String),
  dateRange: t.list(t.String)
});

/**
 * @swagger
 * definitions:
 *   WorkSheetLitResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Worksheet"
 */
t.WorkSheetLitResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.WorkSheet)
  },
  {
    name: 'WorksheetLitResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
);

/**
 * @swagger
 * definitions:
 *   QueueListResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/WorksheetQueue"
 */
t.QueueListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.WorksheetQueue)
  },
  {
    name: 'QueueListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
);
