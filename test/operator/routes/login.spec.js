import request from 'supertest';
import squel from 'squel';

import app from '../../../src/app';
import {Operator} from '../../../src/operator/models';

describe('operator.routes', () => {
  before(async function() {
    this.timeout(10000);
    await app.locals.bucketPromise;
    const operator = new Operator();
    const qb = operator.getQueryBuilder('delete');
    qb
      .where(
        squel.expr()
          .or('username = ?', 'operator3')
          .or('username = ?', 'operator4')
      );
    await operator.query(qb);
    await operator.save({
      username: 'operator3',
      password: 'Passw0rd',
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
      password: 'Passw0rd',
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
  });

  describe('POST /operator/login @request', () => {
    it('200 Autenticado exitosamente', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operator/login')
        .send({
          username: 'operator3',
          password: 'Passw0rd'
        })
        .expect(200);
      response.body.should.be.a('object');
      response.body.should.have.a.property('token');
      response.body.should.have.a.property('roles');
      response.body.roles.should.be.a('array');
      response.body.should.have.a.property('operator');
      response.body.operator.should.be.a('object');
      response.body.operator.should.have.a.property('id');
      response.body.operator.should.have.a.property('name');
      response.body.operator.should.have.a.property('username');
    });

    it('401 Credenciales invalidos', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operator/login')
        .send({
          username: 'operator1',
          password: 'Passw0rd1'
        })
        .expect(401);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });

    it('401 Cuenta desactivada', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operator/login')
        .send({
          username: 'operator4',
          password: 'Passw0rd'
        })
        .expect(401);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });
  });
}).timeout(10000);
