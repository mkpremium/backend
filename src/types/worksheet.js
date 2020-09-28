import { logger } from '../infrastructure/logger'
import _filter from 'lodash/filter'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'
import t from 'tcomb'
import { utc } from '../lib/date'
import { newHttpError } from '../lib/http-error'
import '../owner/types'
import { ScheduledEvent } from '../scheduled-events/types'
import { Building } from './building'
import { Address } from './common'
import { Queue } from './constants'
import { OwnerWithInclude } from './owner'

export const WorkSheetStatus = {
  DEFAULT: 'OPEN',
  WITH_OWNER: 'LOOKING_MEETING',
  INVALID: 'INVALID',
  NO_SALE: 'NO_SALE',
  ALREADY_SOLD: 'YA_VENDIO',
  MEETING: 'MEETING',
  PUBLIC: 'ENTE_PUBLICO'
}

export const worksheetStatusCanBeInsideFreezer = function (status) {
  switch (status) {
    case WorkSheetStatus.PUBLIC:
    case WorkSheetStatus.INVALID:
      return false
    default:
      return true
  }
}

t.WorkSheetStatus = t.enums.of(Object.values(WorkSheetStatus), 'WorkSheetStatus')

t.WorkSheetQueueStatus = t.enums(Queue.Status, 'WorkSheetQueueStatus')

t.WorkSheetCall = t.struct({
  ownerId: t.String,
  realizedAt: t.Date
}, 'WorkSheetCall')

export const Worksheet = t.struct({
  id: t.maybe(t.String),
  worksheetIndex: t.maybe(t.Number),
  calls: t.list(t.WorkSheetCall),

  queueId: t.maybe(t.String),

  relatedBuildingIds: t.list(t.String),
  relatedBuildings: t.list(Building),
  relatedOwnerIds: t.list(t.String),
  relatedOwners: t.list(OwnerWithInclude),

  // never store this
  ownerContacts: t.list(t.OwnerCompactView),

  status: t.WorkSheetStatus,

  price: t.struct({
    maximumToPay: t.Number,
    askedByOwner: t.Number
  }, 'WorkSheet/price'),

  viewedAt: t.maybe(t.Date),
  viewedBy: t.maybe(t.String),

  _migrateId: t.maybe(t.String),
  _relatedTo: t.maybe(t.String),

  lastAddedMeeting: t.maybe(ScheduledEvent),

  _documentType: t.enums.of([ 'worksheet' ]),

  buildingAddress: t.maybe(Address),

  statusChangedAt: t.maybe(t.Date),
  inFreezer: t.Boolean
}, {
  name: 'WorkSheet',
  defaultProps: {
    status: 'OPEN',
    relatedOwnerIds: [],
    relatedOwners: [],
    ownerContacts: [],
    relatedBuildingIds: [],
    relatedBuildings: [],
    price: {
      maximumToPay: 0,
      askedByOwner: 0
    },
    calls: [],
    _documentType: 'worksheet',
    inFreezer: false
  }
})

Worksheet.prototype.setStatus = function (newStatus) {
  if (newStatus === this.status) {
    logger.debug('WorkSheet#setStatus status remains equals', { status: this.status, id: this.id })
    return this
  } else {
    logger.debug('WorkSheet#setStatus status changed', { oldStatus: this.status, newStatus, id: this.id })
    return t.update(this, { status: { $set: newStatus }, statusChangedAt: { $set: utc().toDate() } })
  }
}

Worksheet.prototype.fixStatus = function (newStatus) {
  return t.update(this, { status: { $set: newStatus } })
}

Worksheet.prototype.pullOutFreezer = function (newStatus) {
  const updated = this.setStatus(newStatus)

  return t.update(updated, {
    inFreezer: { $set: false },
    lastAddedMeeting: { $set: null }
  })
}

Worksheet.prototype.cleanMeetings = function () {
  return t.update(this, {
    lastAddedMeeting: { $set: null }
  })
}

Worksheet.prototype.putOnFreezer = function () {
  const $set = worksheetStatusCanBeInsideFreezer(this.status)
  return t.update(this, { inFreezer: { $set } })
}

Worksheet.prototype.setStatusChangedAt = function (newDate) {
  return t.update(this, { statusChangedAt: { $set: newDate } })
}

t.QueueItem = t.struct(
  {
    id: t.maybe(t.String),
    worksheetId: t.String,
    operatorId: t.maybe(t.String),
    status: t.WorkSheetQueueStatus,
    addedAt: t.Date,
    event: t.maybe(t.Any)
  },
  {
    name: 'QueueItem',
    defaultProps: {
      status: Queue.Status.AVAILABLE,
      get addedAt () {
        return new Date()
      }
    }
  }
)

t.QueueItemExtraInfo = t.QueueItem.extend({
  totalContacts: t.Number,
  totalBuildings: t.Number,
  ownerName: t.maybe(t.String),
  ownerType: t.maybe(t.String),
  buildingAddress: t.maybe(t.String),
  note: t.maybe(t.String),
  lastCall: t.maybe(t.WorkSheetCall)
})

t.QueueItem.prototype.canBeOpened = function (operatorId) {
  if (operatorId && this.operatorId) {
    return operatorId === this.operatorId
  }
  return Queue.StatusAvailable.indexOf(this.status) !== -1
}

t.QueueItem.prototype.canBeReleased = function (operatorId) {
  if (operatorId && this.operatorId) {
    return operatorId === this.operatorId
  }

  return false
}

t.QueueItem.prototype.take = function (operatorId = null) {
  return t.update(this, {
    status: { $set: Queue.Status.OPENED },
    operatorId: { $set: operatorId }
  })
}

t.QueueItem.prototype.release = function () {
  return t.update(this, {
    status: { $set: Queue.Status.AVAILABLE },
    operatorId: { $set: null },
    event: { $set: null }
  })
}

t.QueueItem.prototype.schedule = function (operatorId, scheduledEvent) {
  return t.update(this, {
    status: { $set: Queue.Status.SCHEDULED },
    operatorId: { $set: operatorId },
    event: { $set: scheduledEvent }
  })
}

t.QueueItem.prototype.releaseSchedule = function (operatorId) {
  if (this.status === Queue.Status.SCHEDULED && this.operatorId === operatorId) {
    return this.release()
  }
  throw newHttpError(400, 'No puede liberar este item')
}

const WorksheetQueueSource = t.struct({
  city: t.maybe(t.String),
  province: t.maybe(t.String),
  zone: t.maybe(t.String),
  neighborhood: t.maybe(t.String)
}, 'source')

export const WorksheetQueueBody = t.struct(
  {
    name: t.String,
    source: WorksheetQueueSource
  }, {
    name: 'WorksheetQueueBody',
    defaultProps: {
      source: {}
    }
  }
)

export const WorksheetQueue = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    source: WorksheetQueueSource,
    worksheets: t.list(t.QueueItem),
    worksheetIndex: t.maybe(t.Number),

    _documentType: t.enums.of([ 'worksheet-queue' ])
  },
  {
    name: 'WorksheetQueue',
    defaultProps: {
      worksheets: [],
      source: {},
      _documentType: 'worksheet-queue'
    }
  }
)

export const WorksheetQueueCount = WorksheetQueue.extend(
  {
    possibleNumberOfWorksheets: t.Number
  }
)

t.WorksheetQueueExtraInfo = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    size: t.Number,
    source: WorksheetQueueSource,
    worksheets: t.list(t.QueueItemExtraInfo),

    _documentType: t.enums.of([ 'worksheet-queue' ])
  },
  {
    name: 'WorksheetQueue',
    defaultProps: {
      worksheets: [],
      source: {},
      size: 100,
      _documentType: 'worksheet-queue'
    }
  }
)

WorksheetQueue.prototype.findItemById = function (id) {
  return _find(this.worksheets, { id })
}

WorksheetQueue.prototype.findItemByWorksheetId = function (worksheetId) {
  return _find(this.worksheets, { worksheetId })
}

WorksheetQueue.prototype.findOpenedItemByOperatorId = function (operatorId) {
  return _find(this.worksheets, { operatorId, status: Queue.Status.OPENED })
}

WorksheetQueue.prototype.findScheduledItemsByOperatorId = function (operatorId) {
  return _filter(this.worksheets, { operatorId, status: Queue.Status.SCHEDULED })
}

WorksheetQueue.prototype.findNextAvailableInQueue = function (currentItem = null) {
  const currentItemId = currentItem ? currentItem.id : -1
  const currentIndex = _findIndex(this.worksheets, { id: currentItemId })
  const worksheets = currentIndex !== -1 ? this.worksheets.slice(currentIndex) : this.worksheets
  return _find(worksheets, { status: Queue.Status.AVAILABLE })
}
