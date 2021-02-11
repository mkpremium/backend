import Promise from 'bluebird'
import { logger } from '../infrastructure/logger'
import socketJwt from '../middleware/socketJwt'
import socketIO from 'socket.io'
import { OperatorRepository } from '../operator/models'

const SYSTEM_ID = 'system' // bite me :lel:

export class SocketServer {
  constructor (server) {
    this.onConnection = this.onConnection.bind(this)

    this.io = socketIO(server, {
      serveClient: true,
      // below are engine.IO options
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false
    })

    this.io.use(socketJwt(this.io.sockets))
    this.io.on('connection', this.onConnection)
  }

  onConnection (socket) {
    const isSystem = socket.user.permissions.indexOf(SYSTEM_ID) !== -1
    const msg = `user ${socket.id} ${socket.user.id}/${socket.user.operator.name}`
    logger.debug('SocketServer#onConnection', { msg, id: socket.id, isSystem })
    this.io.emit('welcome', msg)

    if (this.io.sockets[ socket.user.id ]) {
      const oldSocket = this.io.sockets[ socket.user.id ]
      oldSocket.emit('forced-disconnect')
      Promise
        .delay(500)
        .then(() => {
          oldSocket.disconnect()
        })
    }

    this.io.sockets[ socket.user.id ] = socket

    if (isSystem) {
      logger.error('system connected to websocket!')
      socket.on('event', (data, ack) => {
        logger.debug('broadcasting', data.payload.type)
        this.io.emit(data.payload.type, data)
        if (ack) {
          ack(true)
        }
      })
    } else {
      OperatorRepository.setOnline(socket.user.id, true)
        .catch(error => {
          logger.error('SocketServer#onConnection when online', { error })
        })
    }

    socket.on('disconnect', () => {
      OperatorRepository
        .setOnline(socket.user.id, this.io.sockets[ socket.user.id ].connected)
        .catch(error => {
          logger.error('SocketServer#onConnection when online', { errorMessage: error.message })
        })
    })
  }
}
