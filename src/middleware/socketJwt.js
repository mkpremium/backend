import debug from 'debug';
import {verify} from 'jsonwebtoken';
import _get from 'lodash/get';
import {jwt} from '../../config';

const socketJwtDebug = debug('app:socket:jwt');

async function verifySocketToken(socket) {
  const token = _get(socket, 'handshake.query.token', null);
  try {
    return verify(token, jwt.secret);
  } catch (e) {
    throw new Error(`[authentication error] ${e.message}`, e);
  }
}

function socketJwt(sockets) {
  return (socket, next) => {
    verifySocketToken(socket)
      .then(user => {
        socket.user = user;
        next();
      })
      .catch(err => {
        socketJwtDebug('error', err);
        next(err);
      });
  };
}

export default socketJwt;
