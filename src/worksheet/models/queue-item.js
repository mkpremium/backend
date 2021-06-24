import t from 'tcomb'

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
    event: t.maybe(t.Any)
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
    event: { $set: scheduledEvent }
  })
}

QueueItem.prototype.removeScheduledCall = function () {
  t.assert(this.status === QueueStatus.SCHEDULED, 'worksheet is not scheduled')

  return t.update(this, {
    status: { $set: this.operatorId !== undefined ? QueueStatus.OPENED : QueueStatus.AVAILABLE },
    event: { $set: undefined }
  })
}
