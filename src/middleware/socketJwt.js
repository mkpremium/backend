import debug from 'debug';
import jsonwebtoken from 'jsonwebtoken';
import {jwt} from '../../config';

const socketJwtDebug = debug('app:socket:jwt');

const verifyToken = (token) => {
  return jsonwebtoken.verify(token, jwt.secret);
};

function socketJwt(sockets) {
  return (socket, next) => {
    socketJwtDebug('verifying JWT');
    const token = socket.handshake.query.token;
    const decodedToken = verifyToken(token);

    if (decodedToken) {
      socket.decoded_token = decodedToken;
      sockets[decodedToken.id] = socket;
      return next();
    }
    return next(new Error('authentication error'));
  };
}

export default socketJwt;
