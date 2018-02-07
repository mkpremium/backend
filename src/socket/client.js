import io from 'socket.io-client';
import {sign} from 'jsonwebtoken';
import t from 'tcomb';

import {jwt} from '../../config';
import './types';

let socketClient;
const options = {};

function createToken() {
  const payload = {
    id: 'system'
  };
  const options = {
    expiresIn: jwt.expiresIn
  };

  return sign(payload, jwt.secret, options);
}

function connectServer(serverUri) {
  options.query = {token: createToken()};

  return new Promise((resolve, reject) => {
    socketClient = io(serverUri, options);
    
    socketClient.on('connect', () => {
      socketClient.sendEvent = sendEvent;
      resolve(socketClient);
    });
    
    socketClient.on('connect_error', (error) => {
      reject(error);
    });
    
    socketClient.on('reconnect_attempt', () => {
      socketClient.io.opts.transports = ['polling', 'websocket'];
      socketClient.io.opts.query = {
        token: createToken()
      };
    });
  });
}

function sendEvent(body) {
  const socketEvent = t.SocketEvent(body);
  const stringEvent = JSON.stringify(socketEvent);
  return new Promise((resolve, reject) => {
    socketClient.emit('event', stringEvent, (ack) => {
      if (!ack) reject(new Error('Event could not be sent'));
      resolve(stringEvent);
    });
  });
}

export default {connectServer};
