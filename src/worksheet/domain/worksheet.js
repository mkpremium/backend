import _filter from 'lodash/filter'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'
import _get from 'lodash/get'
import _ from 'lodash'
import t from 'tcomb'
import { Building } from '../../building/building'
import { utc } from '../../lib/date'
import { OwnerWithInclude } from '../../owner/owner'
import { OwnerCompactView } from '../../owner/types'

import { ScheduledEvent } from '../../scheduled-events/types'
import { Address } from '../../types/common'
import { QueueItem, QueueStatus } from '../models/queue-item'

export const WorkSheetStatus = {
  DEFAULT: 'OPEN',
  AVAILABLE: 'LOOKING_MEETING',
  INVALID: 'INVALID',
  NO_SALE: 'NO_SALE',
  ALREADY_SOLD: 'YA_VENDIO',
  MEETING: 'MEETING',
  PUBLIC: 'ENTE_PUBLICO'
}

export const WorkSheetStatusEnum = t.enums.of(Object.values(WorkSheetStatus), 'WorkSheetStatus')

export const WorkSheetCall = t.struct({
  ownerId: t.String,
  realizedAt: t.Date
}, 'WorkSheetCall')

export const Worksheet = t.struct({
  id: t.maybe(t.String),
  worksheetIndex: t.maybe(t.Number),
  calls: t.list(WorkSheetCall),

  queueId: t.maybe(t.String),

  relatedBuildingIds: t.list(t.String),
  // buildingId: t.String,
  relatedBuildings: t.list(Building),
  relatedOwnerIds: t.list(t.String),
  relatedOwners: t.list(OwnerWithInclude),

  // never store this
  ownerContacts: t.list(OwnerCompactView),

  status: WorkSheetStatusEnum,

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
    return this
  }

  return Worksheet.update(this, {
    status: { $set: newStatus },
    statusChangedAt: { $set: utc().toDate() },
    freezer: { $set: newStatus === WorkSheetStatus.NO_SALE }
  })
}

Worksheet.prototype.pullOutFreezer = function (newStatus) {
  const updated = this.setStatus(newStatus)

  return t.update(updated, {
    inFreezer: { $set: false },
    lastAddedMeeting: { $set: null }
  })
}

Worksheet.prototype.makeAvailable = function () {
  return t.update(
    this.setStatus(WorkSheetStatus.AVAILABLE),
    {
      inFreezer: { $set: false },
      queueId: { $set: null }
    }
  )
}

export const WorksheetQueueSource = t.struct({
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
    worksheets: t.list(QueueItem),
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

/**
 * @param id
 * @returns {QueueItem}
 */
WorksheetQueue.prototype.findItemById = function (id) {
  return _find(this.worksheets, { id })
}

WorksheetQueue.prototype.findItemByWorksheetId = function (worksheetId) {
  return _find(this.worksheets, { worksheetId })
}

WorksheetQueue.prototype.findOpenedItemByOperatorId = function (operatorId) {
  return _find(this.worksheets, { operatorId, status: QueueStatus.OPENED })
}

WorksheetQueue.prototype.findScheduledItemsByOperatorId = function (operatorId) {
  return _filter(this.worksheets, { operatorId, status: QueueStatus.SCHEDULED })
}

WorksheetQueue.prototype.findNextAvailableInQueue = function (currentItem = null) {
  const currentItemId = currentItem ? currentItem.id : -1
  const currentIndex = _findIndex(this.worksheets, { id: currentItemId })
  const worksheets = currentIndex !== -1 ? this.worksheets.slice(currentIndex) : this.worksheets
  return _find(worksheets, { status: QueueStatus.AVAILABLE })
}

WorksheetQueue.prototype.removeScheduledCall = function (scheduledCallId) {
  const updatedWorksheets = this.worksheets.map(
    w => _get(w, 'event.id') === scheduledCallId ? w.removeScheduledCall() : w
  )
  return t.update(this, {
    worksheets: {
      $set: updatedWorksheets
    }
  })
}

const calculateWorksheetIdsToDrop = (queue, userId, maxOpenedWorksheetsByUser) => {
  const userOpenedWorksheets = queue.worksheets
    .filter(w => w.operatorId === userId && w.status === QueueStatus.OPENED)

  userOpenedWorksheets.sort((a, b) => b.addedAt.valueOf() - a.addedAt.valueOf())
  return _.map(_.drop(userOpenedWorksheets, maxOpenedWorksheetsByUser), 'worksheetId')
}

export const keepOnlyUserNewestOpenedWorksheets = (queue, userId, maxOpenedWorksheetsByUser) => {
  const worksheetIdToDrop = calculateWorksheetIdsToDrop(queue, userId, maxOpenedWorksheetsByUser)

  return [
    t.update(queue, {
      worksheets: {
        $set: queue.worksheets.filter(({ worksheetId }) => !worksheetIdToDrop.includes(worksheetId))
      }
    }),
    worksheetIdToDrop
  ]
}

/**
 * @param {Worksheet} worksheet
 * @return {WorksheetQueue}
 */
WorksheetQueue.prototype.addWorksheet = function (worksheet) {
  return t.update(this, {
    worksheets: {
      $push: [
        QueueItem({
          worksheetId: worksheet.id,
          status: QueueStatus.AVAILABLE,
          addedAt: new Date()
        })
      ]
    }
  })
}

export const takeWorksheet = (queue, worksheet, byUserOfId) => {
  const worksheetQueueItem = queue.worksheets.find(w => w.worksheetId === worksheet.id)
  if (worksheetQueueItem) {
    return [
      queue,
      t.update(worksheet, {
        operatorId: { $set: byUserOfId },
        queueId: { $set: queue.id },
        viewedAt: { $set: utc().toDate() }
      })
    ]
  }

  return [
    WorksheetQueue.update(queue, {
      worksheets: {
        $push: [
          QueueItem({
            worksheetId: worksheet.id,
            status: QueueStatus.OPENED,
            addedAt: new Date(),
            operatorId: byUserOfId
          })
        ]
      }
    }),
    Worksheet.update(worksheet, {
      queueId: { $set: queue.id },
      viewedAt: { $set: utc().toDate() }
    })
  ]
}

export class WorksheetAlreadyTaken extends Error {
  constructor (worksheetId, assignedUserId, newUserId) {
    super('Worksheet already taken by a different user')
    this.worksheetId = worksheetId
    this.assignedUserId = assignedUserId
    this.newUserId = newUserId
  }
}
