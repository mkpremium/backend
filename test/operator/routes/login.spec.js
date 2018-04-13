import request from 'supertest';

import app from '../../../src/app';
import {OperatorRepository} from '../../../src/operator/models';
import {deleteAll} from '../../common';

const password = 'Passw0rd';

describe('operator.routes', () => {
  before(async() => {
    const operator = new OperatorRepository();
    await deleteAll();

    await operator.save({
      username: 'operator3',
      password,
      agentNumber: 'operator3',
      roles: [
        'OPERATOR'
      ],
      profile: {
        firstName: 'Operator',
        lastName: 'Doe'
      }
    });

    await operator.save({
      username: 'operator4',
      password,
      agentNumber: 'operator4',
      enable: false,
      roles: [
        'OPERATOR'
      ],
      profile: {
        firstName: 'Operator',
        lastName: 'Doe'
      }
    });

    await operator.save({
      username: 'business',
      password,
      agentNumber: 'business',
      roles: [
        'OPERATOR',
        'BUSINESS'
      ],
      profile: {
        firstName: 'Business',
        lastName: 'Operator'
      }
    });

    await operator.save({
      username: 'street',
      password,
      agentNumber: 'street',
      roles: [
        'OPERATOR',
        'STREET'
      ],
      profile: {
        firstName: 'Street',
        lastName: 'Operator'
      }
    });
  });

  describe('POST /operators/login @request', () => {
    it('200 Autenticado exitosamente', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators/login')
        .send({
          username: 'operator3',
          password
        })
        .expect(200);
      response.body.should.be.a('object');
      response.body.should.have.a.property('token');
      response.body.should.have.a.property('roles');
      response.body.should.not.exist('firebase');
      response.body.roles.should.be.a('array');
      response.body.should.have.a.property('operator');
      response.body.operator.should.be.a('object');
      response.body.operator.should.have.a.property('id');
      response.body.operator.should.have.a.property('name');
      response.body.operator.should.have.a.property('username');
    });

    it('401 Credenciales inválidos', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators/login')
        .send({
          username: 'operator1',
          password
        })
        .expect(401);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });

    it('401 Cuenta desactivada', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators/login')
        .send({
          username: 'operator4',
          password
        })
        .expect(401);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });

    it('200 Login con firebase (informador)', async() => {
      const {body} = await request(app)
        .post('/operators/login')
        .send({
          username: 'street',
          password
        })
        .expect(200);

      body.should.have.a.property('firebase');
      body.firebase.should.have.a.property('databaseURL');
      /street/i.test(body.firebase.databaseURL).should.be.equal(true);
    });

    it('200 Login con firebase (comercial)', async() => {
      const {body} = await request(app)
        .post('/operators/login')
        .send({
          username: 'business',
          password
        })
        .expect(200);

      body.should.have.a.property('firebase');
      body.firebase.should.have.a.property('databaseURL');
      /comercial/i.test(body.firebase.databaseURL).should.be.equal(true);
    });
  });
});
