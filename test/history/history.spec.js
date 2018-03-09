import http from 'http';
import express from 'express';
import request from 'supertest';
import sinon from 'sinon';
import Promise from 'bluebird';
import times from 'lodash/times';
import t from 'tcomb';
import intersectionBy from 'lodash/intersectionBy';

import socket from '../../src/socket';
import {connectServer} from '../../src/socket/client';
import {OperatorRepository} from '../../src/operator/models';
import {History} from '../../src/history/models';
import app from '../../src/app';
import {deleteAll, operatorCreate, operatorLogin} from '../common';

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

describe('history:routes', () => {
  let authenticatedOperator;
  let savedOperator;
  let reqUser;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});

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

    await Promise.all(times(49, () => {
      return History.registerCreate({
        contextModel: savedOperator,
        user: reqUser});
    }
    ));
  });

  describe('GET /history @request', () => {
    describe('200 Operación exitosa', () => {
      it('returns by default 20 items max', async() => {
        const response = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(49);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('limit query param', async() => {
        const response = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({limit: 10})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(49);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(10);
      });

      it('offset query param', async() => {
        const responseLimit = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({limit: 10})
          .expect(200);

        const responseOffsetLimit = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({offset: 5, limit: 5})
          .expect(200);

        responseLimit.body.should.be.a('object');
        responseLimit.body.total.should.equal(49);
        responseLimit.body.results.should.be.a('array');
        responseLimit.body.results.should.have.length(10);
        responseOffsetLimit.body.should.be.a('object');
        responseOffsetLimit.body.total.should.equal(49);
        responseOffsetLimit.body.results.should.be.a('array');
        responseOffsetLimit.body.results.should.have.length(5);
        intersectionBy(responseLimit.body.results, responseOffsetLimit.body.results, 'id').should.have.length(5);
      });

      it('createdAt query param', async() => {
        const response = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({createdAt: '1989-12-27'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(0);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(0);
      });

      it('createdBetween query param', async() => {
        const now = new Date();
        const response = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({createdBetween: `1989-12-27,${now.getFullYear()}-01-31`})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(0);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(0);
      });

      it('operatorId query param', async() => {
        const response = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({operatorId: reqUser.id})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(49);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('actionType query param', async() => {
        const response = await request(app)
          .get('/history')
          .set('Authorization', authenticatedOperator.authorization)
          .query({actionType: 'CREATE'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(49);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });
    });
  });
});
