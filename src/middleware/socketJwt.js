import { logger } from '../infrastructure/logger'
import { verify } from 'jsonwebtoken'
import _get from 'lodash/get'
import { jwt } from '../../config'
import { OperatorRepository } from '../operator/models'

async function verifySocketToken (socket) {
  const token = _get(socket, 'handshake.query.token', null)
  try {
    const user = await verify(token, jwt.secret)
    const repo = new OperatorRepository()
    const operator = await repo.findById(user.id)
    return { user, operator }
  } catch (e) {
    throw new Error(`[authentication error] ${e.message}`)
  }
}

function socketJwt () {
  return (socket, next) => {
    verifySocketToken(socket)
      .then(({ operator, user }) => {
        socket.user = user
        socket.operator = operator || user.operator
        next()
      })
      .catch(error => {
        logger.error('socketJwt', { error })
        next(error)
      })
  }
}

export default socketJwt
