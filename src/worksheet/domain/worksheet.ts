import t from 'tcomb'
import { Building } from '../../building/building'
import { utc } from '../../lib/date'
import { OwnerWithInclude } from '../../owner/owner'

import { ScheduledEvent } from '../../scheduled-events/types'
import { Address } from '../../types/common'
import { QueueItem, QueueStatus } from '../models/queue-item'
import { WorksheetQueue } from './queue'

export const WorkSheetStatus = {
  DEFAULT: 'OPEN',
  AVAILABLE: 'LOOKING_MEETING',
  INVALID: 'INVALID',
  NO_SALE: 'NO_SALE',
  ALREADY_SOLD: 'YA_VENDIO',
  MEETING: 'MEETING',
  PUBLIC: 'ENTE_PUBLICO',
  TAKEN: 'TAKEN'
}

export const WorkSheetStatusEnum = t.enums.of(Object.values(WorkSheetStatus), 'WorkSheetStatus')

export const WorkSheetCall = t.struct({
  ownerId: t.String,
  realizedAt: t.Date
}, 'WorkSheetCall')

export interface WorksheetProps {
  id: string;
  status: WorksheetStatusType;
  relatedBuildingIds: [ string ];
}

export const Worksheet = t.struct<WorksheetProps>({
  id: t.maybe(t.String),
  worksheetIndex: t.maybe(t.Number),
  calls: t.list(WorkSheetCall),

  queueId: t.maybe(t.String),

  relatedBuildingIds: t.list(t.String),
  // buildingId: t.String,
  relatedBuildings: t.list(Building),
  relatedOwnerIds: t.list(t.String),
  relatedOwners: t.list(OwnerWithInclude),

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

export function setStatus (worksheet: WorksheetProps, newStatus: WorksheetStatusType) {
  return Worksheet.update(worksheet, {
    status: { $set: newStatus },
    statusChangedAt: { $set: utc().toDate() },
    inFreezer: { $set: newStatus === WorkSheetStatus.NO_SALE }
  })
}

Worksheet.prototype.statusChanged = function () {
  return Worksheet.update(this, {
    statusChangedAt: { $set: utc().toDate() },
    inFreezer: { $set: this.status === WorkSheetStatus.NO_SALE }
  })
}

Worksheet.prototype.pullOutFreezer = function (newStatus) {
  const updated = setStatus(this, newStatus)

  return t.update(updated, {
    inFreezer: { $set: false },
    lastAddedMeeting: { $set: null }
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
      status: { $set: WorkSheetStatus.TAKEN },
      queueId: { $set: queue.id },
      viewedAt: { $set: utc().toDate() }
    })
  ]
}

export type WorksheetStatusType = 'OPEN'
  | 'LOOKING_MEETING'
  | 'INVALID'
  | 'NO_SALE'
  | 'YA_VENDIO'
  | 'MEETING'
  | 'ENTE_PUBLICO'
  | 'TAKEN'
