import {connectServer} from './client';
import {CouchbaseModel} from '../db/model';

import {SocketServer} from './server';
import {socket} from '../../config';

function startServer(server) {
  return new SocketServer(server);
}

function initModel(name) {
  if (socket.enabled) {
    CouchbaseModel.prototype._socketPromise = connectServer(name);
    return CouchbaseModel.prototype._socketPromise;
  }
}

export default {startServer, initModel};
