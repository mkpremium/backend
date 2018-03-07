import http from 'http';
import express from 'express';
import sinon from 'sinon';
import t from 'tcomb';

import socket from '../../src/socket';
import {connectServer} from '../../src/socket/client';

const port = process.env.SOCKET_PORT || '9002';

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
    server.listen(port, () => {
      socket.startServer(server);
      done();
    });
  });

  after((done) => {
    server.close();
    done();
  });

  describe('event', () => {
    const spy = sinon.spy();
    let client;
    before(async() => {
      client = await connectServer();
      client.socket.on('operator:add', (data) => {
        spy();
      });
    });

    it('should emit an event', async() => {
      const messageSent = await client.sendEvent('add', modelStruct);
      sinon.assert.match(messageSent, true);
      await sinon.assert.match(spy.called, true);
    });

    it('should emit a custom event', async() => {
      const messageSent = await client.sendEvent('custom', customEvent);
      sinon.assert.match(messageSent, true);
    });
  });
});
