import t from 'tcomb'
import { newHttpError } from '../../lib/http-error'

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

QueueItem.prototype.canBeOpened = function (operatorId) {
  if (operatorId && this.operatorId) {
    return operatorId === this.operatorId
  }
  return [
    QueueStatus.AVAILABLE,
    QueueStatus.SCHEDULED
  ]
}

QueueItem.prototype.canBeReleased = function (operatorId) {
  if (operatorId && this.operatorId) {
    return operatorId === this.operatorId
  }

  return false
}

QueueItem.prototype.take = function (operatorId = null) {
  return t.update(this, {
    status: { $set: QueueStatus.OPENED },
    operatorId: { $set: operatorId }
  })
}

/**
 * @returns {QueueItem}
 */
QueueItem.prototype.release = function () {
  return t.update(this, {
    status: { $set: QueueStatus.AVAILABLE },
    operatorId: { $set: null },
    event: { $set: null }
  })
}

QueueItem.prototype.schedule = function (operatorId, scheduledEvent) {
  return t.update(this, {
    status: { $set: QueueStatus.SCHEDULED },
    operatorId: { $set: operatorId },
    event: { $set: scheduledEvent }
  })
}

QueueItem.prototype.removeScheduledCall = function () {
  return t.update(this, {
    status: { $set: this.operatorId !== undefined ? QueueStatus.OPENED : QueueStatus.AVAILABLE },
    event: { $set: undefined }
  })
}

/**
 * @param operatorId
 * @returns {QueueItem}
 */
QueueItem.prototype.releaseSchedule = function (operatorId) {
  if (this.status === QueueStatus.SCHEDULED && this.operatorId === operatorId) {
    return this.release()
  }
  throw newHttpError(400, 'No puede liberar este item')
}
