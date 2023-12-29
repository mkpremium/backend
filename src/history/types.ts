import t from 'tcomb'
import { ListQuery } from '../types/params'

export const RecordAction = t.enums.of([
  'UPDATE',
  'CREATE',
  'DELETE',
  'GET',
  'OPEN',
  'LIST',
  'RELEASE',
  'TAKE',
  'ERROR'
])

export const HistoryStruct = t.struct({
  id: t.maybe(t.String),
  modelName: t.String,
  modelId: t.String,
  operatorId: t.String,
  type: RecordAction,
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
export const HistoryListQuery = ListQuery.extend(
  {
    actionType: t.maybe(RecordAction),
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
export const HistoryListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(HistoryStruct)
  },
  {
    name: 'HistoryListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)
