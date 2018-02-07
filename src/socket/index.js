import debug from 'debug';
import socketIO from 'socket.io';
import socketJwt from '../middleware/socketJwt';

const socketDebug = debug('app:socket');
let io;

function start(server) {
  io = socketIO(server, {
    serveClient: true,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });

  io.use(socketJwt(io.sockets));
  
  io.on('connection', (socket) => {
    socketDebug(`Socket connection for ${socket.id}`);
    
    socket.on('event', (data, ack) => {
      socketDebug('Sending event');
      const eventData = JSON.parse(data);
      io.emit(eventData.name, data);
      ack(true);
    });

    socket.on('disconnect', () => {
      socketDebug('Socket disconnected');
    });
  });
}

export default {start};
