import '../src/infrastructure/o11y/honeycomb'

import http, { Server } from 'http'
import { logger } from '../src/infrastructure/logger'

import { port } from '../config'
import { createApp } from '../src/app'
import { Express } from 'express'
import { AwilixContainer } from 'awilix'
import { Bucket } from 'couchbase'

createApp()
  .then(app => {
    const server = http.createServer(app)

    server.listen(port)
    server.on('error', errorHandler)
    server.on('listen', createListenHandler(server))
    setupGracefulShutdown(server, app.locals.diContainer)
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

function setupGracefulShutdown (server: Server, diContainer: AwilixContainer) {
  const couchbaseBucket: Bucket = diContainer.resolve('couchaseBucket')
  server.close(() => {
    couchbaseBucket.disconnect()
    process.exit()
  })
}
