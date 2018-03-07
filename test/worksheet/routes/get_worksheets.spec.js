import Promise from 'bluebird';
import request from 'supertest';
import times from 'lodash/times';
import intersectionBy from 'lodash/intersectionBy';
import app from '../../../src/app';
import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {OwnerRepository} from '../../../src/owner/models';

describe('worksheet.routes', () => {
  let authenticatedOperator;
  let authenticatedManager;
  let worksheet;
  let ownerIds;
  before(async() => {
    await deleteAll();

    const migrateOwner = new MigrateModel('owner', resolve(__dirname, './../../fixtures/sample_owners.csv'), app);
    await migrateOwner.run();

    const ownerRepo = new OwnerRepository();
    const owners = await ownerRepo.query();

    ownerIds = owners.map(({id}) => id);

    const repo = new WorksheetRepository();
    await Promise.all(times(49, () => repo.save({relatedOwnerIds: ownerIds})));
    worksheet = await repo.save({relatedOwnerIds: ownerIds});

    await operatorCreate();
    await operatorCreateManager();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'password'});
  });

  describe('GET /worksheets @request', () => {
    describe('200 Operación exitosa', () => {
      it('returns by default 20 items max', async() => {
        const response = await request(app)
          .get('/worksheets')
          .set('Authorization', authenticatedManager.authorization)
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(50);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('limit query param', async() => {
        const response = await request(app)
          .get('/worksheets')
          .set('Authorization', authenticatedManager.authorization)
          .query({limit: 10})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(50);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(10);
      });

      it('offset query param', async() => {
        const responseLimit = await request(app)
          .get('/worksheets')
          .set('Authorization', authenticatedManager.authorization)
          .query({limit: 10})
          .expect(200);

        const responseOffsetLimit = await request(app)
          .get('/worksheets')
          .set('Authorization', authenticatedManager.authorization)
          .query({offset: 5, limit: 5})
          .expect(200);

        responseLimit.body.should.be.a('object');
        responseLimit.body.total.should.equal(50);
        responseLimit.body.results.should.be.a('array');
        responseLimit.body.results.should.have.length(10);

        responseOffsetLimit.body.should.be.a('object');
        responseOffsetLimit.body.total.should.equal(50);
        responseOffsetLimit.body.results.should.be.a('array');
        responseOffsetLimit.body.results.should.have.length(5);

        intersectionBy(responseLimit.body.results, responseOffsetLimit.body.results, 'id').should.have.length(5);
      });
    });
  });

  describe('GET /worksheets/:id @request', () => {
    it('200 Obtiene la ficha', async() => {
      const response = await request(app)
        .get(`/worksheets/${worksheet.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .expect(200);
      response.body.should.be.a('object');
      response.body.relatedOwners[0].person.should.be.a('object');
      response.body.toString().should.be.equal(worksheet.toString());
      response.body.should.have.a.property('relatedOwners');
      response.body.relatedOwners.should.be.a('array');
      response.body.relatedOwners.should.have.length(ownerIds.length);
    });

    it('400 Ficha no encontrada', async() => {
      const response = await request(app)
        .get(`/worksheets/not-found`)
        .set('Authorization', authenticatedOperator.authorization)
        .expect(404);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });
  });
});
