import debug from 'debug';
import socketIO from 'socket.io';
import socketJwt from '../middleware/socketJwt';
import {connectServer} from './client';

import {CouchbaseModel} from '../db/model';

const socketDebug = debug('app:socket');

const SYSTEM_ID = 'system'; // bite me :lel:

class SocketServer {
  constructor(server) {
    // region es6
    this.onConnection = this.onConnection.bind(this);
    // endregion

    this.io = socketIO(server, {
      serveClient: true,
      // below are engine.IO options
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false
    });

    this.io.use(socketJwt(this.io.sockets));
    this.io.on('connection', this.onConnection);
  }

  onConnection(socket) {
    const msg = `user ${socket.id} ${socket.user.id}/${socket.user.operator.name}`;
    socketDebug('welcome', msg);
    this.io.emit('welcome', msg); // TODO: send to only users with role X

    if (socket.user.id === SYSTEM_ID) {
      socket.on('event', (data, ack) => {
        this.io.emit(data.payload.type, data);
        ack(true);
      });
    }

    socket.on('disconnect', () => {
      socketDebug('goodbye', msg);
    });
  }
}

function start(server) {
  return new SocketServer(server);
}

function Init() {
  CouchbaseModel.prototype._socketPromise = connectServer();
  return CouchbaseModel.prototype._socketPromise;
}

Init.start = start;

export default Init;
