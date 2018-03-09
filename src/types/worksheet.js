import t from 'tcomb';
import _find from 'lodash/find';
import _findIndex from 'lodash/findIndex';
import {Queue} from './constants';

t.WorkSheetStatus = t.enums.of([
  'OPEN',
  'CLOSED'
], 'WorkSheetStatus');

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
 *
 */
t.WorkSheet = t.struct({
  id: t.maybe(t.String),
  calls: t.list(t.WorkSheetCall),

  queueId: t.maybe(t.String),

  relatedBuildingIds: t.list(t.String),
  relatedBuildings: t.list(t.Building),
  relatedOwnerIds: t.list(t.String),
  relatedOwners: t.maybe(t.list(t.Owner)),

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

/**
 * @swagger
 * definitions:
 *   WorksheetQueue:
 *     properties:
 *       city:
 *         type: string
 *       worksheets:
 *         type: array
 *         items:
 *           $ref: "#/definitions/QueueItem"
 */
t.WorksheetQueue = t.struct(
  {
    id: t.maybe(t.String),
    city: t.String,
    worksheets: t.list(t.QueueItem),

    _documentType: t.enums.of(['worksheet-queue'])
  },
  {
    name: 'WorksheetQueue',
    defaultProps: {
      worksheets: [],
      _documentType: 'worksheet-queue'
    }
  }
);

t.WorksheetQueueExtraInfo = t.struct({
  id: t.maybe(t.String),
  city: t.String,
  worksheets: t.list(t.QueueItemExtraInfo),

  _documentType: t.enums.of(['worksheet-queue'])
},
{
  name: 'WorksheetQueue',
  defaultProps: {
    worksheets: [],
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
  if (!nextItem && currentIndex === this.worksheets.length - 1) {
    return this.findNextAvailable();
  }

  return nextItem;
};
