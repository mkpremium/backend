import request from 'supertest';
import app from '../../../src/app';
import {OwnerRepository} from '../../../src/owner/models';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';

describe('owner.routes', () => {
  let authenticatedOperator;
  let authenticatedManager;
  let ownerToSave;
  let ownerToUpdate;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    await operatorCreateManager();
    const ownerRepo = new OwnerRepository();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'password'});

    ownerToSave = {
      type: 'NINGUNO',
      status: 'BUENO',
      buildingId: '',
      note: '',
      person: {
        name: 'person-test',
        personType: 'NATURAL'
      }
    };
    
    ownerToUpdate = await ownerRepo.save(ownerToSave);
  });

  describe('POST /owners @request', () => {
    it('201 Operación exitosa', async() => {
      await request(app)
        .post('/owners')
        .set('Authorization', authenticatedManager.authorization)
        .send(ownerToSave) // TODO: currently buildingId are optional because the migration data
        .expect(201);
    });
  });

  describe('PUT /owners/:id @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .put(`/owners/${ownerToUpdate.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          status: 'MALO',
          note: 'This is a sample note'
        })
        .expect(204);

      const ownerRepo = new OwnerRepository();
      const updated = await ownerRepo.findById(ownerToUpdate.id);
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
