import http from 'http';
import express from 'express';
import sinon from 'sinon';
import t from 'tcomb';

import socket from '../../src/socket';
import socketClient from '../../src/socket/client';

const port = process.env.SOCKET_PORT || '9002';
const socketServerUri = `http://localhost:${port}`;

const modelStruct = t.Operator({
  id: '5fe1d64e-9383-4483-9443-8a1ed79c2ba0',
  username: 'test',
  password: 'test',
  enable: false,
  roles: ['MANAGER'],
  profile: {
    firstName: 'test',
    lastName: 'test',
    city: 'test'
  },
  agentNumber: '4483-944'
});

const customEvent = {
  id: 'custom',
  model: 'custom',
  type: 'custom',
  data: 'custom'
};

describe('socket.server', () => {
  const app = express();
  let server;

  before((done) => {
    server = http.Server(app);
    socket.start(server);
    server.listen(port);
    done();
  });

  after((done) => {
    server.close();
    done();
  });

  describe('event', () => {
    let client;
    beforeEach(async() => {
      client = await socketClient.connectServer(socketServerUri);
    });
    
    it('should emit an event', async() => {
      const messageSent = await client.sendEvent('add', modelStruct);
      sinon.assert.match(messageSent, true);
    });

    it('should emit a custom event', async() => {
      const messageSent = await client.sendEvent('custom', customEvent);
      sinon.assert.match(messageSent, true);
    });
  });
});
