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
  .catch(errors => {
    logger.error('starting socket dependencies', { errors })
    process.exit(1)
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

  logger.error('Error received', { error })
}
