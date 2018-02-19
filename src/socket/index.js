import debug from 'debug';
import socketIO from 'socket.io';
// import socketJwt from '../middleware/socketJwt';

const socketDebug = debug('app:socket');
let io;

function getEventName(event) {
  const type = event.payload.type.split('-')[0];
  if (type === 'add') {
    return `${event.model}:new`;
  }
  return `${event.model}:${event.id}`;
}

function start(server) {
  io = socketIO(server, {
    serveClient: true,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });

  // io.use(socketJwt(io.sockets));
  
  io.on('connection', (socket) => {
    socketDebug(`Socket connection for ${socket.id}`);
    
    socket.on('event', (data, ack) => {
      socketDebug('Sending event');
      const eventName = getEventName(data);
      io.emit(eventName, data);
      ack(true);
    });

    socket.on('disconnect', () => {
      socketDebug('Socket disconnected');
    });
  });
}

export default {start};
