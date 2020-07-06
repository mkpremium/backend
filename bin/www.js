#!/usr/bin/env node

import http from 'http'
import { logger } from '../src/infrastructure/logger'

import {port} from '../config'
import app from '../src/app'

const server = http.createServer(app)

server.listen(port)
server.on('error', errorHandler)
server.on('listen', listenHandler)

function listenHandler () {
  const addr = server.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  logger.info('API listening on ' + bind)
}

function errorHandler (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  // noinspection FallThroughInSwitchStatementJS
  console.error('Error received', {error})
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
    default:
      throw error
  }
}
