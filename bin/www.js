#!/usr/bin/env node
import '../src/infrastructure/o11y/honeycomb'

import http from 'http'
import { logger } from '../src/infrastructure/logger'

import { port } from '../config'
import { createApp } from '../src/app'

createApp()
  .then(app => {
    const server = http.createServer(app)

    server.listen(port)
    server.on('error', errorHandler)
    server.on('listen', createListenHandler(server))
  })
  .catch(error => {
    logger.error('Starting application', { error })
    process.exit(1)
  })

const createListenHandler = (server) => () => {
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
