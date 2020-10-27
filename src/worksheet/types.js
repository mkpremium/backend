import t from 'tcomb'
import { ListQuery } from '../types/params'
import { StringSplitList } from '../types/refinement'
import { WorkSheetQueueStatus } from './models/queue-item'
import { Worksheet, WorkSheetStatusEnum } from './worksheet'

export const QueueRequestAction = {
  TAKE: 'TAKE',
  RELEASE: 'RELEASE',
  NEXT: 'NEXT'
}

t.QueueRequestAction = t.enums(QueueRequestAction)

export const WorksheetListQuery = ListQuery.extend(
  {
    status: t.maybe(WorkSheetStatusEnum),
    viewedAt: t.maybe(t.String),
    viewedBetween: t.maybe(StringSplitList),
    ownerName: t.maybe(t.String)
  },
  {
    name: 'WorksheetListQuery',
    defaultProps: {
      viewedBetween: ','
    }
  }
)

t.WorksheeQueueListQuery = ListQuery.extend({
  status: t.maybe(WorkSheetQueueStatus),
  operatorId: t.maybe(t.String),
  date: t.maybe(t.String),
  dateRange: t.list(t.String)
})

t.WorkSheetLitResponse = t.struct(
  {
    total: t.Number,
    results: t.list(Worksheet)
  },
  {
    name: 'WorksheetLitResponse',
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

export const WorksheetSearchResponse = t.struct(
  {
    results: t.list(Worksheet)
  },
  {
    name: 'WorksheetSearchResponse',
    defaultProps: {
      results: []
    }
  }
)
