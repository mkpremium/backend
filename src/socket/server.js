import Promise from 'bluebird'
import { logger } from '../infrastructure/logger'
import socketJwt from '../middleware/socketJwt'
import socketIO from 'socket.io'
import _get from 'lodash/get'
import { WorksheetQueueRepository } from '../worksheet/models/queue'
import { Calls } from '../calls/models'
import { OperatorRepository } from '../operator/models'

const SYSTEM_ID = 'system' // bite me :lel:

export class SocketServer {
  constructor (server) {
    // region es6
    this.onConnection = this.onConnection.bind(this)
    // endregion

    this.timers = {}

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
    this.io.emit('welcome', msg) // TODO: send to only users with role X

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

    if (this.timers[ socket.user.id ]) {
      clearTimeout(this.timers[ socket.user.id ])
      delete this.timers[ socket.user.id ]
    }

    socket.on('disconnect', () => {
      const queueId = _get(socket, 'operator.profile.queueId', null)
      const operatorId = _get(socket, 'user.operator.id', null)

      const scheduleRelease = () => {
        this.timers[ socket.user.id ] = setTimeout(() => {
          releaseTakenWorksheets(operatorId, queueId)
            .then(needReschedule => {
              if (needReschedule) {
                scheduleRelease()
              }
            })
            .catch(error => logger.error('SocketServer#onConnection disconnect', { error }))
        }, 60 * 1000)
      }

      if (!isSystem && this.io.sockets[ socket.user.id ].id === socket.id && queueId) {
        logger.debug('SocketServer#onConnection scheduling release taken worksheets for', { userId: socket.user.id })
        scheduleRelease()
      }

      OperatorRepository
        .setOnline(socket.user.id, this.io.sockets[ socket.user.id ].connected)
        .catch(error => {
          logger.error('SocketServer#onConnection when online', { error })
        })
    })
  }
}

async function releaseTakenWorksheets (operatorId, queueId) {
  const modelCall = new Calls()
  const queueRepo = new WorksheetQueueRepository()
  const activeCall = await modelCall.findActiveCallByOperatorId(operatorId)
  if (activeCall) {
    return true
  } else {
    await queueRepo.releaseTakenWorksheetInQueue(queueId, operatorId)
    return false
  }
}
