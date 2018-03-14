import {connectServer} from './client';
import {CouchbaseModel} from '../db/model';

import {SocketServer} from './server';

function startServer(server) {
  return new SocketServer(server);
}

function initModel() {
  CouchbaseModel.prototype._socketPromise = connectServer();
  return CouchbaseModel.prototype._socketPromise;
}

export default {startServer, initModel};
