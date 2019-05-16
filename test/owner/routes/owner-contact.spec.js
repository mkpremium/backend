import request from 'supertest';
import app from '../../../src/app';
import {PersonRepository} from '../../../src/owner/models';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';
import WorksheetHelper from '../../helpers/worksheet';
import _ from 'lodash';
import OwnerHelper from '../../helpers/owner';

const personRepo = new PersonRepository();

// TODO: fix this test
describe('owner-contact.routes', () => {
  let owner;
  let person;
  let authenticatedOperator;
  let authenticatedManager;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    await operatorCreateManager();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});
    authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'Passw0rd'});
  });

  describe('Update owner contact', () => {
    it('Able to update owner contact', async() => {
      const worksheetsWithOwner = await WorksheetHelper.createWorksheetsAndOwnerWithBuilding(authenticatedManager);
      const worksheetAndOwner = _.first(worksheetsWithOwner);
      const owner = worksheetAndOwner.owner;
      const person = await OwnerHelper.findOwnerPerson(owner.personId);
      const contactId = person.contacts[0].id;

      await request(app)
        .put(`/owners/${owner.id}/contacts/${contactId}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          type: 'TELEFONO',
          value: '914290152',
          status: 'GOOD',
          note: 'test note'
        })
        .expect(204);

      const updatedPerson = await personRepo.findById(person.id);

      JSON.stringify(updatedPerson.contacts[0].value).should.be.equal(JSON.stringify('914290152'));
    });

    it.skip('404 Propietario no existe', async() => {
      return request(app)
        .put('/owners/blah-blah/contacts')
        .set('Authorization', authenticatedOperator.authorization)
        .expect(404);
    });
  });

  describe.skip('POST /owners/:id/contacts @request', () => {
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
