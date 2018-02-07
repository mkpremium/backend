import t from 'tcomb';

/**
 * @swagger
 * definitions:
 *   QueueRequestParams:
 *     required:
 *       - queueItemId
 *     properties:
 *       queueItemId:
 *         description: Id del item de la cola *
 *         type: string
 *         format: uuid/v4
 */

t.QueueRequestParams = t.struct({
  queueItemId: t.String
}, 'QueueRequest');
