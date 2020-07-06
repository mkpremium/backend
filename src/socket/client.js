import Promise from 'bluebird'
import io from 'socket.io-client'
import t from 'tcomb'
import { logger } from '../infrastructure/logger'
import uuid from 'uuid/v4'

import { socket as socketConfig } from '../../config'
import './types'
import { OperatorRepository } from '../operator/models'
import { defer } from '../lib/promise-util'

const SYSTEM_ID = 'system'

let buffer = []

export class SocketClient {
  constructor (socket) {
    this.socket = socket
    this.on = this.socket.on
  }

  static buildEvent (type, body) {
    const documentType = body._documentType || body.model
    return t.SocketEvent({
      model: documentType,
      id: body.id,
      payload: {
        type: `${documentType}:${type}`,
        data: body
      },
      timestamp: new Date()
    })
  }

  async sendEvent (type, body) {
    if (!this.socket) {
      throw new Error('No conectado al servidor de sockets')
    }

    const event = SocketClient.buildEvent(type, body)
    const { promise, resolve, reject } = defer()

    logger.info('SocketClient#sendEvent', { eventType: event.payload.type })

    if (this.socket.connected) {
      this.socket.emit('event', event, ack => {
        if (!ack) {
          reject(Error('Evento no pudo ser enviando'))
        } else {
          resolve(ack)
        }
      })
    } else {
      console.error(new Error('Evento no pudo ser enviando, socket no conectado se guarda en buffer'))
      buffer.push({ resolve, reject, event })
      resolve(false)
    }

    return promise
  }
}

export async function connectServer (name = 'mkpremium', onReconnect) {
  const id = uuid()
  const payload = {
    id,
    permissions: [
      SYSTEM_ID
    ],
    operator: {
      id,
      name
    }
  }

  const token = await OperatorRepository.createToken(payload)
  const options = {
    transports: [ 'websocket' ],
    query: {
      token
    },
    reconnectionAttempts: socketConfig.reconnectionAttempts
  }
  let retries = options.reconnectionAttempts

  return new Promise((resolve, reject) => {
    const serverUri = `${socketConfig.server}:${socketConfig.port}`
    const socket = io(serverUri, options)

    socket.on('connect', () => {
      logger.info('socket-client#connectServer Server client connected', { name })
      const client = new SocketClient(socket)
      resolve(client)
      if (onReconnect) {
        onReconnect(Promise.resolve(client))
      }
      for (let i = 0; i < buffer.length; i++) {
        socket.emit('event', buffer[ i ].event)
      }

      buffer = []
    })

    socket.on('connect_error', (error) => {
      logger.error('socket-client#connectServer', { name, error })
      if (retries <= 0) {
        reject(new Error('It\'s possible an error trying to connect socket service check your setup'))
      }
    })

    socket.on('reconnect_attempt', () => {
      logger.info('socket-client#connectServer reconnect_attempt', { name, retries })
      retries--
    })
  })
}
