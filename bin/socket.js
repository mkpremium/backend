#!/usr/bin/env node
import Promise from 'bluebird'
import express from 'express'
import {Server} from 'http'
import { logger } from '../src/infrastructure/logger'

import '../src/types'

import {socket as socketConfig} from '../config'
import socket from '../src/socket'
import couchbase from '../src/db/couchbase'

const app = express()
const httpServer = Server(app)
const server = httpServer.listen(socketConfig.port, listenHandler)

Promise.all([
  socket.initModel('bin-socket'),
  couchbase(app)
])
  .catch(err => {
    console.error(err)
  })

server.on('error', errorHandler)

function listenHandler () {
  socket.startServer(httpServer)
  const addr = httpServer.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  logger.info('Listening on ' + bind)
}

function errorHandler (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof socketConfig.port === 'string'
    ? 'Pipe ' + socketConfig.port
    : 'Port ' + socketConfig.port

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
