import t from 'tcomb';
import find from 'lodash/find';
import {Queue} from './constants';

t.WorkSheetStatus = t.enums.of([
  'OPEN',
  'CLOSED'
], 'WorkSheetStatus');

t.WorkSheetQueueStatus = t.enums(Queue.Status, 'WorkSheetQueueStatus');

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
  calls: t.list(t.struct({
    ownerId: t.String,
    realizedAt: t.Date
  })),
  queueId: t.maybe(t.String),
  relatedBuildingIds: t.list(t.String),
  relatedBuildings: t.list(t.Building),
  relatedOwnerIds: t.list(t.String),
  relatedOwners: t.maybe(t.list(t.Owner)),
  status: t.WorkSheetStatus,

  viewedAt: t.maybe(t.Date),
  viewedBy: t.maybe(t.String),

  _documentType: t.enums.of(['worksheet'])
}, {
  name: 'WorkSheet',
  defaultProps: {
    status: 'OPEN',
    relatedOwnerIds: [],
    relatedOwners: [],
    relatedBuildingIds: [],
    relatedBuildings: [],
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

t.WorksheetQueue.prototype.findItemById = function(id) {
  return find(this.worksheets, {id});
};

t.WorksheetQueue.prototype.findItemByOperatorId = function(operatorId) {
  return find(this.worksheets, {operatorId});
};
