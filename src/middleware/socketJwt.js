import debug from 'debug';
import {verify} from 'jsonwebtoken';
import _get from 'lodash/get';
import {jwt} from '../../config';
import {OperatorRepository} from '../operator/models';

const socketJwtDebug = debug('app:socket:jwt');

async function verifySocketToken(socket) {
  const token = _get(socket, 'handshake.query.token', null);
  try {
    const user = await verify(token, jwt.secret);
    const repo = new OperatorRepository();
    const operator = await repo.findByIdOrThrow(user.id);
    return {user, operator};
  } catch (e) {
    throw new Error(`[authentication error] ${e.message}`);
  }
}

function socketJwt() {
  return (socket, next) => {
    verifySocketToken(socket)
      .then(({operator, user}) => {
        socket.user = user;
        socket.operator = operator;
        next();
      })
      .catch(err => {
        socketJwtDebug('error', err);
        next(err);
      });
  };
}

export default socketJwt;
