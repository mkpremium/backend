import t from 'tcomb'
import { ListQuery } from '../types/params'

/**
 * @swagger
 * definitions:
 *   History:
 *     properties:
 *       modelName:
 *         type: string
 *       modelId:
 *         type: string
 *       operatorId:
 *         type: string
 *       type:
 *         type: string
 *         enum: [UPDATE, CREATE, GET, OPEN, LIST, RELEASE, TAKE, ERROR]
 *       description:
 *         type: string
 *       createdAt:
 *         type: string
 */
t.History = t.struct({
  id: t.maybe(t.String),
  modelName: t.String,
  modelId: t.String,
  operatorId: t.String,
  type: t.RecordAction,
  description: t.String,
  createdAt: t.Date,
  _documentType: t.String
},
{
  name: 'History',
  defaultProps: {
    _documentType: 'history',
    get createdAt () {
      return new Date()
    }
  }
})

/**
 * @swagger
 * definitions:
 *   HistoryListResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/History"
 */
t.HistoryListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.History)
  },
  {
    name: 'HistoryListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

t.HistoryListQuery = ListQuery.extend(
  {
    actionType: t.maybe(t.RecordAction),
    modelName: t.maybe(t.String),
    operatorId: t.maybe(t.String),
    createdAt: t.maybe(t.String),
    createdBetween: t.maybe(t.String)
  },
  {
    name: 'HistoryListQuery',
    defaultProps: {
      createdBetween: ','
    }
  }
)
