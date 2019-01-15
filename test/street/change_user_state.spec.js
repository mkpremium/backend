import request from 'supertest';

import app from '../../src/app';
import {
  deleteAll,
  operatorCreateAdmin,
  operatorCreateStreet,
  operatorCreateStreetManager,
  operatorLogin
} from '../common';

describe('street.routes', () => {
  let authenticatedManager;
  let street;
  let admin;

  before(async() => {
    await deleteAll();
    await operatorCreateStreetManager();
    admin = await operatorCreateAdmin();
    street = await operatorCreateStreet();
    authenticatedManager = await operatorLogin(app, {username: 'street_manager', password: 'Passw0rd'});
  });

  describe('POST /api/changeUserState', () => {
    it('200 Operación exitosa', async() => {
      const {body} = await request(app)
        .post('/api/changeUserState')
        .send({
          appToken: authenticatedManager.token,
          userId: street.id,
          state: 'B'
        })
        .expect(200);

      body.should.be.a('object');
      body.should.have.a.property('Error');
      body.should.have.a.property('Message');
      body.Error.should.equal(false);
      body.Message.should.equal(`Usuario ${street.id} bloqueado`);
    });

    it('200 Operación exitosa', async() => {
      const {body} = await request(app)
        .post('/api/changeUserState')
        .send({
          appToken: authenticatedManager.token,
          userId: street.id,
          state: 'A'
        })
        .expect(200);

      body.should.be.a('object');
      body.should.have.a.property('Error');
      body.should.have.a.property('Message');
      body.Error.should.equal(false);
      body.Message.should.equal(`Usuario ${street.id} activo`);
    });

    it('403 Operación no permitida', async() => {
      const {body} = await request(app)
        .post('/api/changeUserState')
        .send({
          appToken: authenticatedManager.token,
          userId: admin.id,
          state: 'A'
        })
        .expect(403);

      body.should.be.a('object');
      body.should.have.a.property('Error');
      body.should.have.a.property('Message');
      body.Error.should.equal(true);
    });
  });
});
