import t from 'tcomb'
import { QueueItem, QueueItemProps, QueueStatus } from '../models/queue-item'
import _ from 'lodash'
import _get from 'lodash/get'

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

export interface QueueSource {
  province: string;
  city?: string;
  zone?: string;
  neighborhood?: string;
}

export interface WorksheetQueueProps {
  worksheets: QueueItemProps[]; // queue items
  id: string;
  name: string;
  source: QueueSource;
}

export const WorksheetQueue = t.struct<WorksheetQueueProps>(
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

function calculateWorksheetIdsToDrop (q: WorksheetQueueProps, userId: string, maxToKeep: number): string[] {
  const userOpenedWorksheets = q.worksheets
    .filter(w => w.operatorId === userId && w.status === QueueStatus.OPENED)

  userOpenedWorksheets.sort((a, b) => b.addedAt.valueOf() - a.addedAt.valueOf())
  return _.map(_.drop(userOpenedWorksheets, maxToKeep), 'worksheetId')
}

export function keepOnlyUserNewestOpenedWorksheets (queue: WorksheetQueueProps, userId: string, maxOpenedWorksheetsByUser: number): [Object, string[]] {
  const worksheetIdToDrop = calculateWorksheetIdsToDrop(queue, userId, maxOpenedWorksheetsByUser)

  return [
    t.update(queue, {
      // This would not have any effect on the Postgres implementation as it uses the worksheets array as a relation.
      worksheets: {
        $set: queue.worksheets.filter(({ worksheetId }) => !worksheetIdToDrop.includes(worksheetId))
      }
    }),
    worksheetIdToDrop
  ]
}

export function removeScheduledCall (queue: WorksheetQueueProps, scheduledCallId: string) {
  const updatedWorksheets = queue.worksheets.map(
    w => _get(w, 'event.id') === scheduledCallId ? removeScheduledCallFromItem(w) : w
  )
  return t.update(queue, {
    worksheets: {
      $set: updatedWorksheets
    }
  })
}

export function removeScheduledCallFromItem (queueItem: QueueItemProps) {
  t.assert(queueItem.status === QueueStatus.SCHEDULED, 'worksheet is not scheduled')

  return QueueItem.update(queueItem, {
    status: { $set: queueItem.operatorId !== undefined ? QueueStatus.OPENED : QueueStatus.AVAILABLE },
    event: { $set: undefined }
  })
}
