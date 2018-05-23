import t from 'tcomb';
import _find from 'lodash/find';
import _findIndex from 'lodash/findIndex';
import {Queue} from './constants';
import debug from 'debug';

import '../owner/types';

const debugWorksheet = debug('app:types:worksheet');

export const WorkSheetStatus = {
  DEFAULT: 'OPEN',
  WITH_OWNER: 'LOOKING_MEETING',
  INVALID: 'INVALID',
  NO_SALE: 'NO_SALE',
  ALREADY_SOLD: 'YA_VENDIO',
  MEETING: 'MEETING',
  CLOSE: 'CLOSE'
};

export const workSheetStatusTransition = function(status) {
  switch (status) {
    case WorkSheetStatus.DEFAULT:
      return [
        status,
        WorkSheetStatus.WITH_OWNER,
        WorkSheetStatus.INVALID
      ];
    case WorkSheetStatus.WITH_OWNER:
      return [
        status,
        WorkSheetStatus.NO_SALE,
        WorkSheetStatus.MEETING,
        WorkSheetStatus.ALREADY_SOLD
      ];
    // end status
    case WorkSheetStatus.ALREADY_SOLD:
    case WorkSheetStatus.INVALID:
    case WorkSheetStatus.NO_SALE:
    case WorkSheetStatus.MEETING:
      return [
        status
      ];
    default:
      throw new Error(`Unknown worksheet transition status "${status}"`);
  }
};

t.WorkSheetStatus = t.enums.of(Object.values(WorkSheetStatus), 'WorkSheetStatus');

t.WorkSheetQueueStatus = t.enums(Queue.Status, 'WorkSheetQueueStatus');

t.WorkSheetCall = t.struct({
  ownerId: t.String,
  realizedAt: t.Date
}, 'WorkSheetCall');

/**
 * @swagger
 * definitions:
 *   Worksheet:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       owner:
 *         $ref: "#/definitions/Owner"
 *       queueId:
 *         type: string
 *         format: uuid/v4
 *       relatedOwners:
 *         type: array
 *         items:
 *           $ref: "#/definitions/RelatedOwner"
 *       relatedBuildings:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Building"
 *       ownerContacts:
 *         type: array
 *         items:
 *           $ref: "#/definitions/OwnerCompactView"
 *
 */
t.WorkSheet = t.struct({
  id: t.maybe(t.String),
  calls: t.list(t.WorkSheetCall),

  queueId: t.maybe(t.String),

  relatedBuildingIds: t.list(t.String),
  relatedBuildings: t.list(t.Building),
  relatedOwnerIds: t.list(t.String),
  relatedOwners: t.list(t.Owner),

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

  _documentType: t.enums.of(['worksheet'])
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
    _documentType: 'worksheet'
  }
});

t.WorkSheet.prototype.setStatus = function(newStatus) {
  if (workSheetStatusTransition(this.status).indexOf(newStatus) === -1) {
    throw new Error(`worksheet ${this.id} cannot transition from ${this.status} to ${newStatus}`);
  }

  if (newStatus === this.status) {
    debugWorksheet('setStatus', `${this.id} status "${this.status}" remains equals`);
  } else {
    debugWorksheet('setStatus', `${this.id} status changed to "${newStatus}"`);
  }

  return t.update(this, {status: {$set: newStatus}});
};

/**
 * @swagger
 * definitions:
 *   RelatedOwner:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       person:
 *         $ref: "#/definitions/Person"
 *       note:
 *         type: string
 *       type:
 *         type: string
 */

/**
 * @swagger
 * definitions:
 *   QueueItem:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       operator:
 *         $ref: "#/definitions/Operator"
 *       worksheet:
 *         $ref: "#/definitions/Worksheet"
 *       status:
 *         type: string
 */
t.QueueItem = t.struct(
  {
    id: t.maybe(t.String),
    worksheetId: t.String,
    operatorId: t.maybe(t.String),
    status: t.WorkSheetQueueStatus,
    addedAt: t.Date
  },
  {
    name: 'QueueItem',
    defaultProps: {
      status: Queue.Status.AVAILABLE,
      get addedAt() {
        return new Date();
      }
    }
  }
);

t.QueueItemExtraInfo = t.QueueItem.extend({
  totalContacts: t.Number,
  totalBuildings: t.Number,
  ownerName: t.maybe(t.String),
  ownerType: t.maybe(t.String),
  buildingAddress: t.maybe(t.String),
  note: t.maybe(t.String),
  lastCall: t.maybe(t.WorkSheetCall)
});

t.QueueItem.prototype.canBeOpened = function() {
  return Queue.StatusAvailable.indexOf(this.status) !== -1;
};

t.QueueItem.prototype.take = function(operatorId = null) {
  return t.update(this, {
    status: {$set: Queue.Status.OPENED},
    operatorId: {$set: operatorId}
  });
};

t.QueueItem.prototype.release = function() {
  return t.update(this, {
    status: {$set: Queue.Status.AVAILABLE},
    operatorId: {$set: null}
  });
};

t.QueueItem.prototype.schedule = function(operatorId) {
  return t.update(this, {
    status: {$set: Queue.Status.SCHEDULED},
    operatorId: {$set: operatorId}
  });
};

/**
 * @swagger
 * definitions:
 *   WorksheetQueueSource:
 *     properties:
 *       city:
 *         type: string
 *       province:
 *         type: string
 *       zone:
 *         type: string
 *       neighborhood:
 *         type: string
 */
const WorksheetQueueSource = t.struct({
  city: t.maybe(t.String),
  province: t.maybe(t.String),
  zone: t.maybe(t.String),
  neighborhood: t.maybe(t.String)
}, 'source');

/**
 * @swagger
 * definitions:
 *   WorksheetQueueBody:
 *     required:
 *       - name
 *       - source
 *     properties:
 *       name:
 *         type: string
 *       size:
 *         type: number
 *       source:
 *         $ref: "#/definitions/WorksheetQueueSource"
 */
t.WorksheetQueueBody = t.struct(
  {
    name: t.String,
    size: t.maybe(t.Number),
    source: WorksheetQueueSource
  }, {
    name: 'WorksheetQueueBody',
    defaultProps: {
      source: {}
    }
  }
);

/**
 * @swagger
 * definitions:
 *   WorksheetQueue:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       name:
 *         type: string
 *       source:
 *         $ref: "#/definitions/WorksheetQueueSource"
 *       worksheets:
 *         type: array
 *         items:
 *           $ref: "#/definitions/QueueItem"
 */
t.WorksheetQueue = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    source: WorksheetQueueSource,
    worksheets: t.list(t.QueueItem),

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
);

t.WorksheetQueueExtraInfo = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    size: t.Number,
    source: WorksheetQueueSource,
    worksheets: t.list(t.QueueItemExtraInfo),

    _documentType: t.enums.of(['worksheet-queue'])
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
);

t.WorksheetQueue.prototype.findItemById = function(id) {
  return _find(this.worksheets, {id});
};

t.WorksheetQueue.prototype.findItemByWorksheetId = function(worksheetId) {
  return _find(this.worksheets, {worksheetId});
};

t.WorksheetQueue.prototype.findItemByOperatorId = function(operatorId) {
  return _find(this.worksheets, {operatorId});
};

t.WorksheetQueue.prototype.findNextAvailable = function(currentItem = null) {
  const currentItemId = currentItem ? currentItem.id : -1;
  const currentIndex = _findIndex(this.worksheets, {id: currentItemId});
  const worksheets = currentIndex !== -1 ? this.worksheets.slice(currentIndex) : this.worksheets;
  const nextItem = _find(worksheets, {status: Queue.Status.AVAILABLE});
  if (!nextItem && currentIndex === this.worksheets.length - 1 && this.worksheets.length > 0) {
    return this.findNextAvailable();
  }

  return nextItem;
};
