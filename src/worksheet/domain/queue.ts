import t from 'tcomb'
import { QueueItem, QueueItemProps, QueueItemStatus } from '../models/queue-item'
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
  province: string | string[];
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

    _documentType: t.enums.of(['worksheet-queue'])
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
  t.assert(queueItem.status === QueueItemStatus.SCHEDULED, 'worksheet is not scheduled')

  return QueueItem.update(queueItem, {
    status: { $set: queueItem.operatorId !== undefined ? QueueItemStatus.OPENED : QueueItemStatus.AVAILABLE },
    event: { $set: undefined }
  })
}
