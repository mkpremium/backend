import t from 'tcomb'
import { QueueItem, QueueStatus, removeScheduledCallFromItem } from '../models/queue-item'
import _ from 'lodash'
import _get from 'lodash/get'
import _find from 'lodash/find'
import _filter from 'lodash/filter'

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

export interface WorksheetQueueProps {
  worksheets: any[]; // queue items
  id: string;
  name: string;
  source: {
    city?: string;
    province?: string;
    zone?: string;
    neighborhood?: string;
  };
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

WorksheetQueue.prototype.findItemByWorksheetId = function (worksheetId) {
  return _find(this.worksheets, { worksheetId })
}

WorksheetQueue.prototype.findOpenedItemByOperatorId = function (operatorId) {
  return _find(this.worksheets, { operatorId, status: QueueStatus.OPENED })
}

WorksheetQueue.prototype.findScheduledItemsByOperatorId = function (operatorId) {
  return _filter(this.worksheets, { operatorId, status: QueueStatus.SCHEDULED })
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

const calculateWorksheetIdsToDrop = (queue, userId, maxOpenedWorksheetsByUser): string[] => {
  const userOpenedWorksheets = queue.worksheets
    .filter(w => w.operatorId === userId && w.status === QueueStatus.OPENED)

  userOpenedWorksheets.sort((a, b) => b.addedAt.valueOf() - a.addedAt.valueOf())
  return _.map(_.drop(userOpenedWorksheets, maxOpenedWorksheetsByUser), 'worksheetId')
}
export const keepOnlyUserNewestOpenedWorksheets: (queue, userId, maxOpenedWorksheetsByUser) => [ Object, string[] ] = (queue, userId, maxOpenedWorksheetsByUser) => {
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

export function removeScheduledCall (queue: WorksheetQueueProps, scheduledCallId) {
  const updatedWorksheets = queue.worksheets.map(
    w => _get(w, 'event.id') === scheduledCallId ? removeScheduledCallFromItem(w) : w
  )
  return t.update(queue, {
    worksheets: {
      $set: updatedWorksheets
    }
  })
}

export const WorksheetQueueCount = WorksheetQueue.extend({
  possibleNumberOfWorksheets: t.Number
})
