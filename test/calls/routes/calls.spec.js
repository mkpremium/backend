import request from 'supertest';
import {resolve} from 'path';
import app from '../../../src/app';
import {OwnerRepository, PersonRepository} from '../../../src/owner/models';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';

describe('calls.routes', () => {
  let owner;
  let person;
  before(async() => {
    await app.locals.bucketPromise;
    const ownerRepo = new OwnerRepository();
    const personRepo = new PersonRepository();
    await ownerRepo.deleteQuery();
    await personRepo.deleteQuery();

    const migrate = new MigrateModel('owner', resolve(__dirname, '../../fixtures/sample_calls_owner.csv'), app);
    const results = await migrate.run();
    person = results.find(o => o.contacts && o.contacts.length > 0);
    owner = results.find(o => o.personId === person.id);
  });

  describe('POST /calls/owner/:id @request', () => {
    it('400 Operación fallida', async() => {
      await request(app)
        .post(`/calls/owner/${owner.id}`)
        .send({
          value: 'TEST'
        }).expect(400);
    });
  });

  describe('POST /calls/hangup/:callId @request', () => {
    it('400 Operación fallida', async() => {
      const callId = 1111;
      await request(app)
        .post(`/calls/hangup/${callId}`).expect(400);
    });
  });
});
