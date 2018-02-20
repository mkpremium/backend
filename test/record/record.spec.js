import http from 'http';
import express from 'express';
import sinon from 'sinon';
import t from 'tcomb';

import socket from '../../src/socket';
import socketioClient from '../../src/socket/client';
import {OperatorRepository} from '../../src/operator/models';
import {Record} from '../../src/record/models';

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

describe('record.event', () => {
  const app = express();
  let server;
  let socketClient;
  
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
    const spy = sinon.spy();
    let savedOperator;
    let record;
    let reqUser;

    beforeEach(async() => {
      record = new Record(true);
      const operatorRepo = new OperatorRepository();
      await operatorRepo.deleteQuery();
      savedOperator = await operatorRepo.save(modelStruct);
      reqUser = {
        id: savedOperator.id,
        permissions: savedOperator.roles
      };
      socketClient = await socketioClient.connectServer();

      socketClient.on('record:new', (data) => {
        spy();
      });
    });
    
    it('should register record', async() => {
      const savedRecord = await record.register('CREATE', savedOperator, reqUser);
      savedRecord.model.should.be.equal('operator');
    });

    it('should register error if model is invalid', async() => {
      const savedRecord = await record.register('CREATE', null, reqUser);
      savedRecord.type.should.be.equal('ERROR');
    });

    it('should receive record event', async() => {
      await spy.should.have.been.callCount(1);
    });
  });
});
