import t from 'tcomb';

/**
 * @swagger
 * definitions:
 *  Calls:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *         description: Id de registro de llamada
 *       to:
 *         type: integer
 *         description: Numero a quien se realizo la llamada
 *       data:
 *         type: object
 *         descripcion: Detalles de peticion de llamada realizada
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
  to: t.Number,
  data: t.Object,
  date: t.Date,
  status: t.CallStatus,
  _documentType: t.String
},
{
  name: 'Calls',
  defaultProps: {
    status: 'Iniciada',
    _documentType: 'calls'
  }
});

t.CallService = t.struct({
  from: t.String,
  to: t.String,
  options: t.struct({
    service_id: t.Integer,
    return_id: t.Boolean
  }, 'CallOptions')
}, 'CallService');

t.HangupService = t.struct({
  options: t.struct({
    call_id: t.Integer
  }, 'HangupOptions')
}, 'HangupService');

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
