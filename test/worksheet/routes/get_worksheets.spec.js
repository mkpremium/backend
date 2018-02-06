import Promise from 'bluebird';
import request from 'supertest';
import times from 'lodash/times';
import intersectionBy from 'lodash/intersectionBy';
import app from '../../../src/app';
import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';

describe('worksheet.routes', () => {
  let worksheet;
  before(async() => {
    await app.locals.bucketPromise;

    const repo = new WorksheetRepository();
    const qb = repo.getQueryBuilder('delete');
    await repo.query(qb);
    await Promise.all(times(49, () => repo.save({})));
    worksheet = await repo.save({});
    await Promise.delay(1000);
  });

  describe('GET /worksheets @request', () => {
    describe('200 Operación exitosa', () => {
      it('returns by default 20 items max', async() => {
        const response = await request(app)
          .get('/worksheets')
          .expect(200);
        response.body.should.be.a('array');
        response.body.should.have.length(20);
      });

      it('limit query param', async() => {
        const response = await request(app)
          .get('/worksheets')
          .query({limit: 10})
          .expect(200);
        response.body.should.be.a('array');
        response.body.should.have.length(10);
      });

      it('offset query param', async() => {
        const responseLimit = await request(app)
          .get('/worksheets')
          .query({limit: 10})
          .expect(200);

        const responseOffsetLimit = await request(app)
          .get('/worksheets')
          .query({offset: 5, limit: 5})
          .expect(200);
        responseLimit.body.should.be.a('array');
        responseLimit.body.should.have.length(10);
        responseOffsetLimit.body.should.be.a('array');
        responseOffsetLimit.body.should.have.length(5);
        intersectionBy(responseLimit.body, responseOffsetLimit.body, 'id').should.have.length(5);
      });
    });
  });

  describe('GET /worksheets/:id @request', () => {
    it('200 Obtiene la ficha', async() => {
      const response = await request(app)
        .get(`/worksheets/${worksheet.id}`)
        .expect(200);
      response.body.should.be.a('object');
      response.body.toString().should.be.equal(worksheet.toString());
    });

    it('400 Ficha no encontrada', async() => {
      const response = await request(app)
        .get(`/worksheets/not-found`)
        .expect(404);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });
  });
});
