import io from 'socket.io-client';
import {sign} from 'jsonwebtoken';
import t from 'tcomb';

import {jwt, socket as socketConfig} from '../../config';
import './types';

let socketClient;
const serverUri = `${socketConfig.server}:${socketConfig.port}`;
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

function connectServer() {
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

function getEventStruct(type, body) {
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

function rejectIfNotConnected(reject) {
  if (!socketClient || !socketClient.connected) {
    return reject(new Error('SocketClient is not connected'));
  }
}

function sendEvent(type, body) {
  const socketEvent = getEventStruct(type, body);
  return new Promise((resolve, reject) => {
    rejectIfNotConnected(reject);
    socketClient.emit('event', socketEvent, (ack) => {
      if (!ack) reject(new Error('Event could not be sent'));
      resolve(ack);
    });
  });
}

export default {connectServer, sendEvent};
