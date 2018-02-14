import request from 'supertest';
import {resolve} from 'path';
import app from '../../../src/app';
import {OperatorRepository} from '../../../src/operator/models';
import {OwnerRepository, PersonRepository} from '../../../src/owner/models';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';
import {operatorLogin} from '../../common';

describe('calls.routes', () => {
  let owner;
  let person;
  let authenticatedOperator;
  before(async() => {
    await app.locals.bucketPromise;
    const ownerRepo = new OwnerRepository();
    const personRepo = new PersonRepository();
    await ownerRepo.deleteQuery();
    await personRepo.deleteQuery();

    const operatorRepo = new OperatorRepository();
    await operatorRepo.save({
      username: 'callerOperator',
      password: 'password',
      agentNumber: '10106-903',
      serviceId: '17146',
      roles: [
        'OPERATOR'
      ],
      profile: {
        firstName: 'operator',
        lastName: 'operator'
      }
    });
    authenticatedOperator = await operatorLogin(app, {username: 'callerOperator', password: 'password'});
    const migrate = new MigrateModel('owner', resolve(__dirname, '../../fixtures/sample_calls_owner.csv'), app);
    const results = await migrate.run();
    person = results.find(o => o.contacts && o.contacts.length > 0);
    owner = results.find(o => o.personId === person.id);
  });

  describe('POST /calls/owner/:id @request', () => {
    it('200 Operación exitosa', async() => {
      await request(app)
        .post(`/calls/owner/${owner.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          value: '+56949826553'
        }).expect(200);
    });
  });

  describe('POST /calls/owner/:id @request', () => {
    it('400 Operación fallida', async() => {
      await request(app)
        .post(`/calls/owner/${owner.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          value: 'TEST'
        }).expect(400);
    });
  });

  describe('POST /calls/hangup/:callId @request', () => {
    it('400 Operación fallida', async() => {
      const callId = 1111;
      await request(app)
        .post(`/calls/hangup/${callId}`)
        .set('Authorization', authenticatedOperator.authorization)
        .expect(400);
    });
  });
});
