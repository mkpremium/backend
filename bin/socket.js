#!/usr/bin/env node

import express from 'express'
import { Server } from 'http'
import { logger } from '../src/infrastructure/logger'

import '../src/types'

import { socket as socketConfig } from '../config'
import socket from '../src/socket'
import couchbase from '../src/db/couchbase'

const app = express()
app.set('IS_READY', false)
app.get('/_ready', (req, res) => {
  if (app.get('IS_READY')) {
    res.sendStatus(200)
  } else {
    res.sendStatus(503)
  }
})

const httpServer = Server(app)
const server = httpServer.listen(socketConfig.port, listenHandler)

couchbase()
  .then(() => {
    app.set('IS_READY', true)
  })
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
