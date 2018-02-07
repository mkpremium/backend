#!/usr/bin/env node

import express from 'express';
import debug from 'debug';

import {socketPort} from '../config';
import socket from '../src/socket';

const socketDebug = debug('app:socket');

const app = express();
const server = app.listen(socketPort, listenHandler);
socket.start(server);

server.on('error', errorHandler);

function listenHandler() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  socketDebug('Listening on ' + bind);
}

function errorHandler(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof socketPort === 'string'
    ? 'Pipe ' + socketPort
    : 'Port ' + socketPort;

  // handle specific listen errors with friendly messages
  // noinspection FallThroughInSwitchStatementJS
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}
