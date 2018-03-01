import http from 'http';
import express from 'express';
import sinon from 'sinon';
import t from 'tcomb';

import socket from '../../src/socket';
import {connectServer} from '../../src/socket/client';
import {OperatorRepository} from '../../src/operator/models';
import {History} from '../../src/history/models';
import {deleteAll} from '../common';
// import {defer} from '../../src/lib/promise-util';

const port = process.env.SOCKET_PORT || '9002';

const modelStruct = t.Operator({
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

describe('history.register', () => {
  let server;
  before((done) => {
    const app = express();
    server = http.Server(app);
    server.listen(port, () => {
      socket.startServer(server);
      socket.initModel();
      done();
    });
  });

  after((done) => {
    server.close();
    done();
  });

  describe('event', () => {
    const spy = sinon.spy();
    let savedOperator;
    let reqUser;
    let client;

    before(async() => {
      await deleteAll();
      const operatorRepo = new OperatorRepository();
      savedOperator = await operatorRepo.save(modelStruct);
      reqUser = {
        id: savedOperator.id,
        operator: {
          username: 'test',
          agentNumber: '10106-905',
          serviceId: '17146'
        }
      };
      client = await connectServer();

      client.socket.on('history:new', (data) => {
        spy();
      });
    });

    it('should register CREATE history', async() => {
      const savedRecord = await History.registerCreate({
        contextModel: savedOperator,
        user: reqUser
      }, true);
      savedRecord.description.should.be.equal('test ha creado Operador');
      await sinon.assert.match(spy.called, true);
    });

    it('should register LIST history', async() => {
      const savedRecord = await History.registerList({
        contextModel: 'operator',
        user: reqUser
      }, true);
      savedRecord.description.should.be.equal('test ha listado Operadores');
    });

    it('should register UPDATE history', async() => {
      const savedRecord = await History.registerUpdate({
        contextModel: savedOperator,
        user: reqUser
      }, true);
      savedRecord.description.should.be.equal('test ha actualizado Operador');
    });

    it('should register GET history', async() => {
      const savedRecord = await History.registerGet({
        contextModel: savedOperator,
        user: reqUser
      }, true);
      savedRecord.description.should.be.equal('test ha obtenido Operador');
    });

    it('should register OPEN history', async() => {
      const savedRecord = await History.registerOpen({
        contextModel: savedOperator,
        user: reqUser
      }, true);
      savedRecord.description.should.be.equal('test ha abierto Operador');
    });

    it('should register ERROR if model is invalid', async() => {
      const savedRecord = await History.registerCreate({
        contextModel: null,
        user: reqUser
      }, true);
      savedRecord.type.should.be.equal('ERROR');
    });
  });
});
