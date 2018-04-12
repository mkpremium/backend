import request from 'supertest';
import app from '../../../src/app';
import {OwnerRepository, PersonRepository} from '../../../src/owner/models';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';

describe('owner.routes', () => {
  let authenticatedOperator;
  let authenticatedManager;
  let ownerWithPersonToSave;
  let ownerToUpdate;
  let savedPerson;

  before(async() => {
    await deleteAll();
    await operatorCreate();
    await operatorCreateManager();
    const ownerRepo = new OwnerRepository();
    const personRepo = new PersonRepository();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'password'});

    ownerWithPersonToSave = {
      type: 'PRINCIPAL',
      status: 'VERIFICADO',
      buildingId: '',
      note: '',
      person: {
        name: 'person-test',
        personType: 'NATURAL'
      }
    };

    savedPerson = await personRepo.save(ownerWithPersonToSave.person);
    ownerToUpdate = await ownerRepo.save(ownerWithPersonToSave);
  });

  describe('POST /owners @request', () => {
    it('201 Registrar owner con person - Operación exitosa', async() => {
      await request(app)
        .post('/owners')
        .set('Authorization', authenticatedManager.authorization)
        .send(ownerWithPersonToSave) // TODO: currently buildingId are optional because the migration data
        .expect(201);
    });
    it('201 Registrar owner con personId - Operación exitosa', async() => {
      delete ownerWithPersonToSave.person;
      ownerWithPersonToSave.personId = savedPerson.id;
      await request(app)
        .post('/owners')
        .set('Authorization', authenticatedManager.authorization)
        .send(ownerWithPersonToSave)
        .expect(201);
    });
  });

  describe('PUT /owners/:id @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .put(`/owners/${ownerToUpdate.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          status: 'NO_VERIFICADO',
          note: 'This is a sample note'
        })
        .expect(204);

      const ownerRepo = new OwnerRepository();
      const updated = await ownerRepo.findById(ownerToUpdate.id);
      updated.status.should.be.equal('NO_VERIFICADO');
      updated.note.should.be.equal('This is a sample note');
    });

    it('204 Verificar un propietario', async() => {
      await request(app)
        .put(`/owners/${ownerToUpdate.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          status: 'VERIFICADO',
          verified: true,
          note: 'This is a sample note'
        })
        .expect(204);

      const ownerRepo = new OwnerRepository();
      const updated = await ownerRepo.findById(ownerToUpdate.id);
      updated.status.should.be.equal('VERIFICADO');
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
