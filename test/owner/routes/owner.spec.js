import request from 'supertest';
import {resolve} from 'path';
import app from '../../../src/app';
import {OwnerRepository} from '../../../src/owner/models';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';

describe('owner.routes', () => {
  let owner;
  let person;
  let authenticatedOperator;
  let authenticatedManager;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    await operatorCreateManager();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'password'});
    const migrate = new MigrateModel('owner', resolve(__dirname, '../../fixtures/sample_owners.csv'), app);
    const results = await migrate.run();
    person = results.find(o => o.contacts && o.contacts.length > 0);
    owner = results.find(o => o.personId === person.id);
  });

  describe('POST /owners @request', () => {
    it('201 Operación exitosa', async() => {
      await request(app)
        .post('/owners')
        .set('Authorization', authenticatedManager.authorization)
        .send({}) // TODO: currently personId and buildingId are optional because the migration data
        .expect(201);
    });
  });

  describe('PUT /owners/:id @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .put(`/owners/${owner.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          status: 'MALO',
          note: 'This is a sample note'
        })
        .expect(204);

      const ownerRepo = new OwnerRepository();
      const updated = await ownerRepo.findById(owner.id);

      updated.status.should.be.equal('MALO');
      updated.note.should.be.equal('This is a sample note');
    });

    it('404 Propietario no existe', async() => {
      return request(app)
        .put('/owners/blah-blah')
        .set('Authorization', authenticatedOperator.authorization)
        .expect(404);
    });
  });
});
