import t from 'tcomb'
import { DateTimeString } from '../../infrastructure/shared-types'
import { ScheduledEventTypeEnum } from '../../scheduled-events/types'

export enum QueueItemStatus {
  AVAILABLE = 'AVAILABLE',
  OPENED = 'OPENED',
  SCHEDULED = 'SCHEDULED',
}

export const WorkSheetQueueItemStatus = t.enums(QueueItemStatus, 'WorkSheetQueueStatus')

export interface QueueItemProps {
  id?: string
  worksheetId: string
  operatorId?: string
  status: QueueItemStatus
  addedAt: Date
  event?: {
    id: string
    eventDate: Date
    type: string
  }
}

export const QueueItem = t.struct<QueueItemProps>({
    id: t.maybe(t.String),
    worksheetId: t.String,
    operatorId: t.maybe(t.String),
    status: WorkSheetQueueItemStatus,
    addedAt: t.Date,
    event: t.maybe(t.struct({
      id: t.String,
      eventDate: t.union([ t.Date, DateTimeString ]),
      type: ScheduledEventTypeEnum
    }))
  },
  {
    name: 'QueueItem',
    defaultProps: {
      status: QueueItemStatus.AVAILABLE,
      get addedAt () {
        return new Date()
      }
    }
  }
)
