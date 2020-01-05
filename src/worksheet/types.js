import t from 'tcomb'
import { WorksheetQueueCount } from '../types/worksheet'

export const QueueRequestAction = {
  TAKE: 'TAKE',
  RELEASE: 'RELEASE',
  NEXT: 'NEXT'
}

t.QueueRequestAction = t.enums(QueueRequestAction)

/**
 * @swagger
 * definitions:
 *   QueueRequestParams:
 *     properties:
 *       queueItemId:
 *         description: Id del item de la cola *
 *         type: string
 *         format: uuid/v4
 *       action:
 *         description: Acción a realizar en el item
 *         type: string
 *         default: TAKE
 */

const QueueRequestParams = t.struct(
  {
    action: t.maybe(t.QueueRequestAction)
  },
  {
    name: 'QueueRequest',
    defaultProps: {
      action: QueueRequestAction.TAKE
    }
  }
)

const QueueRequestItemParams = QueueRequestParams.extend(
  {
    queueItemId: t.String
  }
)

const QueueRequestWorksheetParams = QueueRequestParams.extend(
  {
    worksheetId: t.String
  }
)

t.QueueRequestParams = t.union([QueueRequestParams, QueueRequestItemParams, QueueRequestWorksheetParams])
t.QueueRequestParams.dispatch = function (x) {
  switch (x.action) {
    case QueueRequestAction.NEXT:
      return QueueRequestParams
    case QueueRequestAction.RELEASE:
      return QueueRequestWorksheetParams
    default:
      return QueueRequestItemParams
  }
}

export const WorksheetListQuery = t.WorksheetListQuery = t.ListQuery.extend(
  {
    status: t.maybe(t.WorkSheetStatus),
    viewedAt: t.maybe(t.String),
    viewedBetween: t.maybe(t.StringSplitList),
    ownerName: t.maybe(t.String)
  },
  {
    name: 'WorksheetListQuery',
    defaultProps: {
      viewedBetween: ','
    }
  }
)

t.WorksheeQueueListQuery = t.ListQuery.extend({
  status: t.maybe(t.WorkSheetQueueStatus),
  operatorId: t.maybe(t.String),
  date: t.maybe(t.String),
  dateRange: t.list(t.String)
})

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
)

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
    results: t.list(WorksheetQueueCount)
  },
  {
    name: 'QueueListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

export const WorksheetSearchQuery = t.WorksheetSearchQuery = t.struct(
  {
    query: t.String,
    limit: t.Positive
  },
  {
    name: 'WorksheetSearchQuery',
    defaultProps: {
      limit: 20
    }
  }
)

/**
 * @swagger
 * definitions:
 *   WorksheetSearchResponse:
 *     required:
 *       - results
 *     properties:
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Worksheet"
 */
export const WorksheetSearchResponse = t.struct(
  {
    results: t.list(t.WorkSheet)
  },
  {
    name: 'WorksheetSearchResponse',
    defaultProps: {
      results: []
    }
  }
)
