import Promise from 'bluebird';
import debug from 'debug';
import socketJwt from '../middleware/socketJwt';
import socketIO from 'socket.io';
import _get from 'lodash/get';
import {WorksheetQueueRepository} from '../worksheet/models/queue';

const socketDebug = debug('app:socket');
const SYSTEM_ID = 'system'; // bite me :lel:

export class SocketServer {
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
      const oldSocket = this.io.sockets[socket.user.id];
      oldSocket.emit('forced-disconnect');
      Promise
        .delay(500)
        .then(() => {
          oldSocket.disconnect();
        });
    }

    this.io.sockets[socket.user.id] = socket;
    const isSystem = socket.user.permissions.indexOf(SYSTEM_ID) !== -1;

    socketDebug('socket', socket.id, 'can broadcast events?', isSystem);

    if (isSystem) {
      socket.on('event', (data, ack) => {
        socketDebug('broadcasting', data.payload.type);
        this.io.emit(data.payload.type, data);
        ack(true);
      });
    }

    socket.on('disconnect', () => {
      const queueId = _get(socket, 'operator.profile.queueId', null);
      const operatorId = _get(socket, 'user.operator.id', null);

      if (!isSystem && this.io.sockets[socket.user.id].id === socket.id && queueId) {
        socketDebug('releasing taken worksheets for', socket.user.id);
        const queueRepo = new WorksheetQueueRepository();
        queueRepo.releaseTakenWorksheetInQueue(queueId, operatorId).catch(err => {
          console.error(err);
        });
      }
    });
  }
}
