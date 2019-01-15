import request from 'supertest';

import app from '../../../src/app';
import {deleteAll, operatorCreate, operatorLogin} from '../../common';

describe('operator.routes', () => {
  let authenticatedOperator;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});
  });

  describe('POST /operators/refresh-token @request', () => {
    it('200 Autenticado exitosamente', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operators/refresh-token')
        .set('Authorization', authenticatedOperator.refreshToken)
        .send()
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
  });
});
