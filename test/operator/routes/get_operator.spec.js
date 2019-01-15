import Promise from 'bluebird';
import request from 'supertest';
import times from 'lodash/times';
import intersectionBy from 'lodash/intersectionBy';
import app from '../../../src/app';
import {deleteAll, operatorCreate, operatorCreateAdmin, operatorLogin} from '../../common';

describe('operator.routes', () => {
  let authenticatedAdmin;
  before(async() => {
    await deleteAll();

    await Promise.all(times(50, (i) => operatorCreate(i)));

    await operatorCreate();
    await operatorCreateAdmin();
    authenticatedAdmin = await operatorLogin(app, {username: 'admin', password: 'Passw0rd'});
  });

  describe('GET /operators @request', () => {
    describe('200 Operación exitosa', () => {
      it('returns by default 20 items max', async() => {
        const response = await request(app)
          .get('/operators')
          .set('Authorization', authenticatedAdmin.authorization)
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(52);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('limit query param', async() => {
        const response = await request(app)
          .get('/operators')
          .set('Authorization', authenticatedAdmin.authorization)
          .query({limit: 10})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(52);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(10);
      });

      it('offset query param', async() => {
        const responseLimit = await request(app)
          .get('/operators')
          .set('Authorization', authenticatedAdmin.authorization)
          .query({limit: 10})
          .expect(200);

        const responseOffsetLimit = await request(app)
          .get('/operators')
          .set('Authorization', authenticatedAdmin.authorization)
          .query({offset: 5, limit: 5})
          .expect(200);
        responseLimit.body.should.be.a('object');
        responseLimit.body.total.should.equal(52);
        responseLimit.body.results.should.be.a('array');
        responseLimit.body.results.should.have.length(10);

        responseOffsetLimit.body.should.be.a('object');
        responseOffsetLimit.body.total.should.equal(52);
        responseOffsetLimit.body.results.should.be.a('array');
        responseOffsetLimit.body.results.should.have.length(5);
        intersectionBy(responseLimit.body.results, responseOffsetLimit.body.results, 'id').should.have.length(5);
      });

      it('role query param', async() => {
        const response = await request(app)
          .get('/operators')
          .set('Authorization', authenticatedAdmin.authorization)
          .query({role: 'ADMIN'})
          .expect(200);

        response.body.should.be.a('object');
        response.body.total.should.equal(1);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(1);
      });
    });
  });
});
