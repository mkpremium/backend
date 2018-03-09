import debug from 'debug';
import socketIO from 'socket.io';
import socketJwt from '../middleware/socketJwt';
import {connectServer} from './client';
import _get from 'lodash/get';

import {CouchbaseModel} from '../db/model';
import {WorksheetQueueRepository} from '../worksheet/models/queue';

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

    if (this.io.sockets[socket.user.id]) {
      this.io.sockets[socket.user.id].disconnect();
    }

    this.io.sockets[socket.user.id] = socket;

    if (socket.user.permissions.indexOf(SYSTEM_ID) !== -1) {
      socket.on('event', (data, ack) => {
        this.io.emit(data.payload.type, data);
        ack(true);
      });
    }

    socket.on('disconnect', async() => {
      const cityName = _get(socket, 'user.operator.profile.city', null);
      const operatorId = _get(socket, 'user.operator.id', null);

      if (this.io.sockets[socket.user.id].id === socket.id && cityName) {
        const queueRepo = new WorksheetQueueRepository();
        await queueRepo.releaseTakenWorksheetInQueue(cityName, operatorId);
      }
      socketDebug('goodbye', msg);
    });
  }
}

function startServer(server) {
  return new SocketServer(server);
}

function initModel() {
  CouchbaseModel.prototype._socketPromise = connectServer();
  return CouchbaseModel.prototype._socketPromise;
}

export default {startServer, initModel};
