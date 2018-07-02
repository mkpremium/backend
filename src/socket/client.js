import io from 'socket.io-client';
import t from 'tcomb';
import debug from 'debug';
import uuid from 'uuid/v4';

import {socket as socketConfig} from '../../config';
import './types';
import {OperatorRepository} from '../operator/models';
import {defer} from '../lib/promise-util';

const SYSTEM_ID = 'system';
const debugClient = debug('app:socket:server-client');

export class SocketClient {
  constructor(socket) {
    this.socket = socket;
    this.on = this.socket.on;
  }

  static buildEvent(type, body) {
    const documentType = body._documentType || body.model;
    return t.SocketEvent({
      model: documentType,
      id: body.id,
      payload: {
        type: `${documentType}:${type}`,
        data: body
      },
      timestamp: new Date()
    });
  }

  async sendEvent(type, body) {
    if (!this.socket) {
      throw new Error('No conectado al servidor de sockets');
    }

    const event = SocketClient.buildEvent(type, body);
    const {promise, resolve, reject} = defer();

    debugClient('emitting', event.payload.type);

    this.socket.emit('event', event, ack => {
      if (!ack) {
        reject(Error('Evento no pudo ser enviando'));
      } else {
        resolve(ack);
      }
    });

    return promise;
  }
}

export async function connectServer(name = 'mkpremium') {
  const id = uuid();
  const payload = {
    id,
    permissions: [
      SYSTEM_ID
    ],
    operator: {
      id,
      name
    }
  };

  const token = await OperatorRepository.createToken(payload);
  const options = {
    transports: ['websocket'],
    query: {
      token
    },
    reconnectionAttempts: socketConfig.reconnectionAttempts
  };
  let retries = options.reconnectionAttempts;

  return new Promise((resolve, reject) => {
    const serverUri = `${socketConfig.server}:${socketConfig.port}`;
    const socket = io(serverUri, options);

    socket.on('connect', () => {
      debugClient('Server client connected');
      const client = new SocketClient(socket);
      resolve(client);
    });

    socket.on('connect_error', (error) => {
      debugClient('connect_error', error.message);
      if (retries <= 0) {
        reject(new Error(`It's possible an error trying to connect socket service check your setup`));
      }
    });

    socket.on('reconnect_attempt', () => {
      debugClient('reconnect_attempt');
      retries--;
    });
  });
}
