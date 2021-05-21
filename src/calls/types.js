import t from 'tcomb'
import uuid from 'uuid/v4'

export const CallStatus = {
  early: 'INICIADA',
  confirmed: 'EN_PROGRESO',
  terminated: 'FINALIZADA',
  unknown: 'DESCONOCIDO'
}

t.Calls = t.struct(
  {
    id: t.maybe(t.String),
    userId: t.String,
    from: t.String,
    to: t.String,
    callId: t.String,
    notes: t.Array,
    events: t.Array,
    date: t.Date,
    status: t.enums.of(Object.values(CallStatus), 'CallStatus'),
    origin: t.String,
    _documentType: t.String
  },
  {
    name: 'Calls',
    defaultProps: {
      status: 'DESCONOCIDO',
      _documentType: 'calls',
      origin: 'SYSTEM',
      get date () {
        return new Date()
      },
      events: [],
      notes: []
    }
  })

t.CallService = t.struct({
  from: t.String,
  to: t.String,
  service_id: t.Integer,
  return_id: t.Boolean
}, 'CallService')

t.CallBody = t.struct({
  contactId: t.maybe(t.String)
}, 'CallBody')

t.HangupSuccessResponse = t.struct({
  status: t.maybe(t.String)
}, 'HangupSuccessResponse')

t.CallErrorResponse = t.struct({
  status: t.maybe(t.String),
  error_code: t.maybe(t.Integer),
  description: t.String
}, 'CallErrorResponse')

t.CallsRawEvents = t.struct(
  {
    content: t.Object,
    date: t.Date,

    _documentType: t.enums.of(['calls-raw-events'])
  }
  , {
    name: 'CallsRawEvents',
    defaultProps: {
      get id () {
        return uuid()
      },
      get date () {
        return new Date()
      },
      _documentType: 'calls-raw-events'
    }
  })

t.AddCallNote = t.struct({
  id: t.maybe(t.String),
  note: t.maybe(t.String)
}, {
  name: 'AddCallNote',
  defaultProps: {
    get id () {
      return uuid()
    }
  }
})
