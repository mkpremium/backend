import t from 'tcomb'
import { utc } from '../../lib/date'

import { Address, AddressProp } from '../../types/common'
import { QueueItem, QueueItemStatus } from '../models/queue-item'
import { WorksheetQueue, WorksheetQueueProps } from './queue'

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
  id: string
  status: WorksheetStatusType
  relatedBuildingIds: [ string ]
  buildingAddress: AddressProp
  queueId?: string
  statusChangeReason?: string
  statusChangedAt?: Date,
  viewedAt?: Date
  viewedBy?: string
}

export const Worksheet = t.struct<WorksheetProps>({
  id: t.maybe(t.String),
  worksheetIndex: t.maybe(t.Number),
  calls: t.list(WorkSheetCall),

  queueId: t.maybe(t.String),

  relatedBuildingIds: t.list(t.String),
  // buildingId: t.String,
  relatedOwnerIds: t.list(t.String),

  status: WorkSheetStatusEnum,
  statusChangeReason: t.maybe(t.String),

  price: t.struct({
    maximumToPay: t.Number,
    askedByOwner: t.Number
  }, 'WorkSheet/price'),

  viewedAt: t.maybe(t.Date),
  viewedBy: t.maybe(t.String),

  _migrateId: t.maybe(t.String),
  _relatedTo: t.maybe(t.String),

  lastAddedMeeting: t.maybe(t.struct({
    id: t.String
  })),

  _documentType: t.enums.of(['worksheet']),

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

export function setStatus (worksheet: WorksheetProps, newStatus: WorksheetStatusType, reason?: string) {
  const spec = {
    status: { $set: newStatus },
    statusChangedAt: { $set: utc().toDate() },
    inFreezer: { $set: newStatus === WorkSheetStatus.NO_SALE }
  } as any
  if (reason) {
    spec.statusChangeReason = { $set: reason }
  }
  return Worksheet.update(worksheet, spec)
}

export const takeWorksheet = (queue: WorksheetQueueProps, worksheet: WorksheetProps, byUserOfId: string): [ WorksheetQueueProps, WorksheetProps ] => {
  const worksheetQueueItem = queue.worksheets.find(w => w.worksheetId === worksheet.id)
  if (worksheetQueueItem) {
    return [
      queue,
      Worksheet.update(worksheet, {
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
            status: QueueItemStatus.OPENED,
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
