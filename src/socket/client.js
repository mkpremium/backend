import io from 'socket.io-client';
import t from 'tcomb';

import {socket as socketConfig} from '../../config';
import './types';
import {OperatorRepository} from '../operator/models';
import {defer} from '../lib/promise-util';

const SYSTEM_ID = 'system';

export class SocketClient {
  constructor(socket) {
    this.socket = socket;
  }

  static buildEvent(type, body) {
    const documentType = body._documentType || body.model;
    return t.SocketEvent({
      model: documentType,
      id: body.id,
      payload: {
        type: `${type}-${documentType}`,
        data: body
      },
      timestamp: new Date()
    });
  }

  async sendEvent(type, body) {
    if (this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor de sockets');
    }

    const event = SocketClient.buildEvent(type, body);
    const {promise, resolve, reject} = defer();

    this.socket.emit('event', event, ack => {
      if (!ack) {
        reject(Error('Evento no pudo ser enviando'));
      } else {
        resolve();
      }
    });

    return promise;
  }
}

export async function connectServer() {
  const payload = {
    id: SYSTEM_ID,
    operator: {
      id: SYSTEM_ID,
      name: 'mkpremium'
    }
  };

  const token = await OperatorRepository.createToken(payload);
  const options = {
    transports: ['polling', 'websocket'],
    query: {
      token
    }
  };
  return new Promise((resolve, reject) => {
    const serverUri = `${socketConfig.server}:${socketConfig.port}`;
    const socket = io(serverUri, options);

    socket.on('connect', () => {
      const client = new SocketClient(socket);
      resolve(client);
    });

    socket.on('connect_error', (error) => {
      reject(error);
    });

    socket.on('reconnect_attempt', () => {
      socket.io.opts.transports = options.transports;
      socket.io.opts.query = options.query;
    });
  });
}
