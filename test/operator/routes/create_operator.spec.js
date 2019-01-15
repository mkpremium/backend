import request from 'supertest';

import app from '../../../src/app';
import {OperatorRepository} from '../../../src/operator/models';
import {operatorCreate, operatorCreateAdmin, operatorLogin} from '../../common';

describe('operator.routes', () => {
  let authenticatedAdmin;
  let authenticatedOperator;
  before(async() => {
    const repo = new OperatorRepository();
    await repo.deleteQuery();
    await operatorCreateAdmin();
    await operatorCreate();
    await operatorCreate('test');
    authenticatedAdmin = await operatorLogin(app, {username: 'admin', password: 'Passw0rd'});
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});
  });

  describe('POST /operator @request', () => {
    it('201 Operador creado', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators')
        .set('Authorization', authenticatedAdmin.authorization)
        .send({
          username: 'operator2',
          password: 'Passw0rd',
          agentNumber: 'operator2',
          roles: [
            'OPERATOR'
          ],
          profile: {
            firstName: 'Operator',
            lastName: 'Doe'
          }
        })
        .expect(201);
      response.body.should.be.a('object');
      response.body.should.have.a.property('id');
    });

    it('400 Solicitud invalida', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators')
        .set('Authorization', authenticatedAdmin.authorization)
        .send({
          username: 'operator1',
          password: 'Passw0rd1'
        })
        .expect(400);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });

    it('400 Solicitud invalida (username único)', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators')
        .set('Authorization', authenticatedAdmin.authorization)
        .send({
          username: 'operatortest',
          password: 'Passw0rd',
          agentNumber: 'operator2',
          roles: [
            'OPERATOR'
          ],
          profile: {
            firstName: 'Operator',
            lastName: 'Doe'
          }
        })
        .expect(400);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });

    it('401 Permisos insuficientes', async() => {
      const response = await request(app)
        .post('/operators')
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          username: 'operator2',
          password: 'Passw0rd',
          agentNumber: 'operator2',
          roles: [
            'OPERATOR'
          ],
          profile: {
            firstName: 'Operator',
            lastName: 'Doe'
          }
        })
        .expect(403);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });
  });
});
