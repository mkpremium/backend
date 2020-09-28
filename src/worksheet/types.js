import t from 'tcomb'
import { Worksheet, WorksheetQueueCount } from '../types/worksheet'

export const QueueRequestAction = {
  TAKE: 'TAKE',
  RELEASE: 'RELEASE',
  NEXT: 'NEXT'
}

t.QueueRequestAction = t.enums(QueueRequestAction)

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
