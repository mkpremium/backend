import request from 'supertest';
import {resolve} from 'path';
import app from '../../../src/app';
import {OperatorRepository} from '../../../src/operator/models';
import {Calls} from '../../../src/calls/models';
import {MigrateModel} from '../../../src/migration/lib/migrate-model';
import {deleteAll, operatorLogin} from '../../common';

describe('calls.routes', () => {
  let owner;
  let person;
  let authenticatedOperator;
  let webhookEventStartCall;
  let webhookEventToBeOmitted;

  before(async() => {
    await app.locals.bucketPromise;
    await deleteAll();

    const operatorRepo = new OperatorRepository();

    await operatorRepo.save({
      username: 'callerOperator',
      password: 'password',
      agentNumber: '10106-905',
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

    webhookEventStartCall = {
      tag: 'dialog-info',
      data: {
        remoteidentity: '0056949826553',
        localidentity: '10106-905',
        state: 'early',
        fromuser: '0056949826553',
        ServiceData: '0056949826553#17146#9151938902790598604###1',
        called: '10106-905'
      }
    };

    webhookEventToBeOmitted = {
      tag: 'dialog-info',
      data: {
        remoteidentity: '0056949826553',
        localidentity: '10106-905',
        state: 'early',
        fromuser: '934922728',
        ServiceData: '0056949826553#17146#9151938902790598604###1',
        called: '10106-905'
      }
    };
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

  describe('POST /webhook/calls @request', () => {
    it('200 Operación exitosa', async() => {
      await request(app)
        .post(`/webhook/calls`)
        .send(webhookEventStartCall)
        .expect(200);
    });

    it('204 Operación exitosa - evento desconocido registrado en CallsRawEvents', async() => {
      await request(app)
        .post(`/webhook/calls`)
        .send({data: 'unknown'})
        .expect(204);
    });

    it('204 Operación exitosa - evento omitido', async() => {
      await request(app)
        .post(`/webhook/calls`)
        .send(webhookEventToBeOmitted)
        .expect(204);
    });
  });
});

describe('calls.model', () => {
  let callsModel;
  before(async() => {
    callsModel = new Calls();
    await callsModel.deleteQuery();
    await callsModel.save({
      from: '905',
      to: '+56949826553',
      callId: '9151938902790598604',
      events: [],
      status: 'INICIADA'
    });
  });

  describe('Find Call by callId', () => {
    it('should find call register by callId', async() => {
      const callId = '9151938902790598604';
      const foundCall = await callsModel.findByCallId(callId);
      foundCall.callId.should.be.equal(callId);
    });
  });
});
