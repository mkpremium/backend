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

  describe('PUT /owners/:id/contacts @request', () => {
    it('204 Operación exitosa', async() => {
      const personRepo = new PersonRepository();
      const {value} = person.contacts[0];
      await request(app)
        .put(`/owners/${owner.id}/contacts`)
        .send({
          value,
          status: 'GOOD'
        })
        .expect(204);

      const updatedPerson = await personRepo.findById(person.id);

      JSON.stringify(updatedPerson.contacts[0]).should.be.equal(JSON.stringify({
        type: 'TELEFONO',
        value,
        status: 'GOOD'
      }));
    });

    it('404 Propietario no existe', async() => {
      return request(app)
        .put('/owners/blah-blah/contacts')
        .expect(404);
    });
  });
});
