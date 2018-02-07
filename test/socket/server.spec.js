import http from 'http';
import express from 'express';
import sinon from 'sinon';

import socket from '../../src/socket';
import socketClient from '../../src/socket/client';

const port = process.env.SOCKET_PORT;
const socketServerUri = `http://localhost:${port}`;

const eventMessage = {
  name: 'event:test',
  data: {},
  timestamp: 'Tue Feb 06 2018 210:01:59 GMT-0300 (-03)'
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
      const messageSent = await client.sendEvent(eventMessage);
      sinon.assert.match(JSON.parse(messageSent), eventMessage);
    });
  });
});
