import request from 'supertest';
import {resolve} from 'path';
import app from '../../../src/app';
import {OwnerRepository, PersonRepository} from '../../../src/owner/models';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';

describe('owner.routes', () => {
  let owner;
  let person;
  before(async() => {
    await app.locals.bucketPromise;
    const ownerRepo = new OwnerRepository();
    const personRepo = new PersonRepository();
    await ownerRepo.deleteQuery();
    await personRepo.deleteQuery();

    const migrate = new MigrateModel('owner', resolve(__dirname, '../../fixtures/sample_owners.csv'), app);
    const results = await migrate.run();
    person = results.find(o => o.contacts && o.contacts.length > 0);
    owner = results.find(o => o.personId === person.id);
  });

  describe('PUT /owners/:id @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .put(`/owners/${owner.id}`)
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
        .expect(404);
    });
  });
});
