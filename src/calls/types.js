import t from 'tcomb';
import uuid from 'uuid/v4';

/**
 * @swagger
 * definitions:
 *  Calls:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *         description: Id de registro de llamada
 *       userId:
 *         type: string
 *         format: uuid/v4
 *         description: Id del usuario quien realiza la llamada
 *       from:
 *         type: string
 *         description: Extension que realiza la llamada
 *       to:
 *         type: string
 *         description: Numero a quien se realizo la llamada
 *       callId:
 *         type: integer
 *         descripcion: Identificador de llamada realizada
 *       note:
 *         type: string
 *         descripcion: Nota de llamada
 *       date:
 *         type: string
 *         description: Fecha y hora del registro de llamada
 *       status:
 *         type: string
 *         description: Estado de la llamada
 *
 */
t.Calls = t.struct({
  id: t.maybe(t.String),
  userId: t.String,
  from: t.String,
  to: t.String,
  callId: t.String,
  notes: t.Array,
  events: t.Array,
  date: t.Date,
  status: t.CallStatus,
  origin: t.String,
  _documentType: t.String
},
{
  name: 'Calls',
  defaultProps: {
    status: 'INICIADA',
    _documentType: 'calls',
    origin: 'SYSTEM',
    get date() {
      return new Date();
    },
    events: [],
    notes: []
  }
});

t.CallService = t.struct({
  from: t.String,
  to: t.String,
  service_id: t.Integer,
  return_id: t.Boolean
}, 'CallService');

/**
 * @swagger
 * definitions:
 *  HangupSuccessResponse:
 *     properties:
 *      status:
 *        type: string
 */
t.HangupSuccessResponse = t.struct({
  status: t.maybe(t.String)
}, 'HangupSuccessResponse');

/**
 * @swagger
 * definitions:
 *  CallErrorResponse:
 *     properties:
 *      status:
 *        type: string
 *      error_code:
 *        type: integer
 *      description:
 *        type: string
 */
t.CallErrorResponse = t.struct({
  status: t.maybe(t.String),
  error_code: t.maybe(t.Integer),
  description: t.String
}, 'CallErrorResponse');

t.CallsRawEvents = t.struct({
  content: t.Object,
  date: t.Date
}, 'CallsRawEvents');

/**
 * @swagger
 * definitions:
 *   AddCallNote:
 *     properties:
 *       note:
 *         type: string
 */
t.AddCallNote = t.struct({
  id: t.maybe(t.String),
  note: t.maybe(t.String)
}, {
  name: 'AddCallNote',
  defaultProps: {
    id: uuid()
  }
});
