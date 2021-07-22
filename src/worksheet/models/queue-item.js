import t from 'tcomb'
import { DateTimeString } from '../../infrastructure/shared-types'
import { ScheduledEventTypeEnum } from '../../scheduled-events/types'

export const QueueStatus = {
  AVAILABLE: 'AVAILABLE',
  OPENED: 'OPENED',
  SCHEDULED: 'SCHEDULED',
  CLOSED: 'CLOSED'
}
export const WorkSheetQueueStatus = t.enums(QueueStatus, 'WorkSheetQueueStatus')
export const QueueItem = t.struct(
  {
    id: t.maybe(t.String),
    worksheetId: t.String,
    operatorId: t.maybe(t.String),
    status: WorkSheetQueueStatus,
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
      status: QueueStatus.AVAILABLE,
      get addedAt () {
        return new Date()
      }
    }
  }
)

QueueItem.prototype.schedule = function (operatorId, scheduledEvent) {
  return t.update(this, {
    status: { $set: QueueStatus.SCHEDULED },
    operatorId: { $set: operatorId },
    event: {
      $set: {
        id: scheduledEvent.id,
        type: scheduledEvent.type,
        eventDate: scheduledEvent.eventDate
      }
    }
  })
}

export function removeScheduledCallFromItem (queueItem) {
  t.assert(queueItem.status === QueueStatus.SCHEDULED, 'worksheet is not scheduled')

  return QueueItem.update(queueItem, {
    status: { $set: queueItem.operatorId !== undefined ? QueueStatus.OPENED : QueueStatus.AVAILABLE },
    event: { $set: undefined }
  })
}
