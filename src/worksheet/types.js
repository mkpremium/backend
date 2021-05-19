import t from 'tcomb'
import { ListQuery } from '../types/params'
import { Positive, StringSplitList } from '../types/refinement'
import { Worksheet, WorkSheetStatusEnum } from './domain/worksheet'

export const QueueRequestAction = {
  TAKE: 'TAKE',
  RELEASE: 'RELEASE',
  NEXT: 'NEXT'
}

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

export const WorksheetSearchQuery = t.struct(
  {
    query: t.String,
    limit: Positive
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
