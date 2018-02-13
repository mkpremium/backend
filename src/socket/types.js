import t from 'tcomb';

t.SocketEvent = t.struct({
  model: t.String,
  id: t.String,
  payload: t.struct({
    type: t.String,
    data: t.Any
  }),
  timestamp: t.Date
}, 'SocketEvent');
