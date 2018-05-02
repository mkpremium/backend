import http from 'http';
import express from 'express';
import morgan from 'morgan';
import debug from 'debug';

import {cronjobsPort} from '../config';
import appErrorHandler from '../src/lib/error-handler';
import couchbase from '../src/db/couchbase';

import scheduledEventCronJob from '../src/scheduled-events/cron';
import scheduledTasksCronJob from '../src/firebase/cron';

const app = express();
const server = http.createServer(app);
const cronjobsDebug = debug('app:cron');

server.listen(cronjobsPort);
server.on('error', errorHandler);
server.on('listen', listenHandler);

function listenHandler() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  cronjobsDebug('Listening on ' + bind);
}

function errorHandler(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + cronjobsPort
    : 'Port ' + cronjobsPort;

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

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

couchbase(app);
scheduledEventCronJob.start();
scheduledTasksCronJob.start();

app.use(appErrorHandler);
