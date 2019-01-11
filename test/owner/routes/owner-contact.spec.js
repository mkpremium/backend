import request from 'supertest';
import {resolve} from 'path';
import app from '../../../src/app';
import {PersonRepository} from '../../../src/owner/models';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';
import {deleteAll, operatorCreate, operatorLogin} from '../../common';

const personRepo = new PersonRepository();

//TODO: fix this test
describe.skip('owner-contact.routes', () => {
  let owner;
  let person;
  let authenticatedOperator;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    const migrate = new MigrateModel('owner', resolve(__dirname, '../../fixtures/sample_owners.csv'), app);
    const results = await migrate.run();
    person = results.find(o => o.contacts && o.contacts.length > 0);
    owner = results.find(o => o.personId === person.id);
  });

  describe('PUT /owners/:id/contacts/:contactId @request', () => {
    it('204 Operación exitosa', async() => {
      const contactId = person.contacts[0].id;
      await request(app)
        .put(`/owners/${owner.id}/contacts/${contactId}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          value: '1234567890',
          status: 'GOOD',
          note: 'test note'
        })
        .expect(204);

      const updatedPerson = await personRepo.findById(person.id);

      JSON.stringify(updatedPerson.contacts[0].value).should.be.equal(JSON.stringify('1234567890'));
    });

    it('404 Propietario no existe', async() => {
      return request(app)
        .put('/owners/blah-blah/contacts')
        .set('Authorization', authenticatedOperator.authorization)
        .expect(404);
    });
  });

  describe('POST /owners/:id/contacts @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .post(`/owners/${owner.id}/contacts`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          value: '1234567891',
          status: 'GOOD'
        })
        .expect(200);

      const updatedPerson = await personRepo.findById(person.id);

      updatedPerson.contacts[0].id.should.not.equal(updatedPerson.contacts[1]);
      updatedPerson.contacts.should.have.length(2);
    });
  });
});
