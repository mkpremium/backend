#!/usr/bin/env node

import http from 'http'
import debug from 'debug'

import {port} from '../config'
import app from '../src/app-bank'

const server = http.createServer(app)
const serverDebug = debug('app:server')

server.listen(port)
server.on('error', errorHandler)
server.on('listen', listenHandler)

function listenHandler () {
  const addr = server.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  serverDebug('Listening on ' + bind)
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
