import t from 'tcomb';

t.WorkSheetStatus = t.enums.of([
  'OPEN',
  'CLOSED'
]);

t.WorkSheetQueueStatus = t.enums.of([
  'AVAILABLE',
  'OPENED',
  'SCHEDULED',
  'CLOSED'
]);

/**
 * @swagger
 * definitions:
 *   Worksheet:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       owner:
 *         $ref: "#/definitions/Contact"
 *       lastContactedOwner:
 *         $ref: "#/definitions/Contact"
 *       relatedOwners:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Contact"
 *
 */
t.WorkSheet = t.struct({
  id: t.maybe(t.String),
  calls: t.list(t.struct({
    ownerId: t.String,
    realizedAt: t.Date
  })),
  relatedOwnerIds: t.list(t.String),
  status: t.WorkSheetStatus,

  _documentType: t.enums.of(['worksheet'])
}, {
  name: 'WorkSheet',
  defaultProps: {
    status: 'OPEN',
    relatedOwnerIds: [],
    calls: [],
    _documentType: 'worksheet'
  }
});

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
 *       status:
 *         type: string
 */
t.QueueItem = t.struct({
  id: t.String,
  worksheetId: t.String,
  status: t.WorkSheetQueueStatus
});

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
    city: t.String,
    worksheets: t.list(t.QueueItem),

    _documentType: t.enums.of(['worksheet-queue'])
  },
  {
    name: 'WorksheetQueue',
    defaultProps: {
      _documentType: 'worksheet-queue'
    }
  }
);
