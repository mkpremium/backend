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
 *         type: interger
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
}, 'Calls');

/**
 * @swagger
 * definitions:
 *  CallOptions:
 *     properties:
 *      service_id:
 *        type: interger
 *        description: Service id that applies to this call
 *      return_id:
 *        type: boolean
 *        description: Return the call id
 *  CallService:
 *     required:
 *      - from
 *      - to
 *     properties:
 *      from:
 *        type: string
 *      to:
 *        type: string
 *      options:
 *        $ref: "#/definitions/CallOptions"
 */
t.CallService = t.struct({
  from: t.String,
  to: t.String,
  options: t.struct({
    service_id: t.Integer,
    return_id: t.Boolean
  }, 'CallOptions')
}, 'CallService');

/**
 * @swagger
 * definitions:
 *  HangupOptions:
 *     properties:
 *      call_id:
 *        type: interger
 *        description: Numintec's Identity of call
 *  HangupService:
 *     required:
 *      - options
 *     properties:
 *      options:
 *        $ref: "#/definitions/HangupOptions"
 */
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
 *        type: interger
 *      description:
 *        type: string
 */
t.CallErrorResponse = t.struct({
  status: t.maybe(t.String),
  error_code: t.maybe(t.Integer),
  description: t.String
}, 'CallErrorResponse');
