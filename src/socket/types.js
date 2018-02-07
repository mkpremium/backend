import t from 'tcomb';

t.SocketEvent = t.struct({
  name: t.String,
  data: t.Object,
  timestamp: t.String
}, 'SocketEvent');
