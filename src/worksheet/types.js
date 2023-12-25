import t from 'tcomb'
import { ListQuery } from '../types/params'
import { StringSplitList } from '../types/refinement'
import { WorkSheetStatusEnum } from './domain/worksheet'

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
