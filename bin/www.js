#!/usr/bin/env node

import http from 'http'
import { logger } from '../src/infrastructure/logger'

import { port } from '../config'
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

  logger.error('Error received', { error })
}
