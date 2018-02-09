import request from 'supertest';
import app from '../../../src/app';
import {OwnerRepository, PersonRepository} from '../../../src/owner/models';

describe('owner.routes', () => {
  before(async() => {
    await app.locals.bucketPromise;
    const ownerRepo = new OwnerRepository();
    const personRepo = new PersonRepository();
    await ownerRepo.deleteQuery();
    await personRepo.deleteQuery();
  });

  describe('PUT /owners/:id/contacts @request', () => {
    it('204 Operación exitosa', async() => {
      return request(app)
        .put('/owners/blah-blah/contacts')
        .expect(204);
    });

    it('404 Propietario no existe', async() => {
      return request(app)
        .put('/owners/blah-blah/contacts')
        .expect(404);
    });
  });
});
