import t from 'tcomb';
import Promise from 'bluebird';
import request from 'supertest';
import times from 'lodash/times';
import app from '../../../src/app';

import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';
import {OwnerRepository} from '../../../src/owner/models';

describe('worksheet.routes', () => {
  let queueItems = [];
  let authenticatedOperator;
  let authenticatedManager;
  let owner;
  let _queue;
  before(async() => {
    const worksheetRepo = new WorksheetRepository();
    const worksheetQueueRepo = new WorksheetQueueRepository();

    await deleteAll();
    await operatorCreateManager();

    const queue = await worksheetQueueRepo.save({name: 'madrid'});
    const worksheets = await Promise.all(times(5, () => worksheetRepo.save({})));

    queueItems = await Promise.map(worksheets, async(worksheet) => worksheetQueueRepo.addWorksheet(queue, worksheet));

    const updatedQueue = t.update(queue, {worksheets: {$set: queueItems}});
    _queue = await worksheetQueueRepo.save(updatedQueue);

    await operatorCreate('', _queue.id);
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'password'});
  });

  describe('Worksheet Operator actions', () => {
    it('Toma el item de la cola', async() => {
      await request(app)
        .post(`/worksheets/queues/${_queue.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({queueItemId: queueItems[0].id})
        .expect(200);

      const response = await request(app)
        .get(`/worksheets/queues/${_queue.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .expect(200);
      const openedWorksheets = response.body.worksheets.filter(w => w.status === 'OPENED');
      openedWorksheets.should.have.length(1);
      const [openedWorksheet] = openedWorksheets;
      openedWorksheet.should.have.a.property('operatorId');
      openedWorksheet.operatorId.should.be.equal(authenticatedOperator.operator.id);
    });

    it('Agrega un nuevo propietario', async() => {
      const ownerResponse = await request(app)
        .post(`/worksheets/${queueItems[0].worksheetId}/owners`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          person: {
            name: 'Julian Reyes',
            documentNumber: '1118880055',
            personType: 'NATURAL',
            contacts: [
              {
                type: 'TELEFONO',
                value: '12345678',
                status: 'UNDEFINED'
              }
            ]
          },
          buildingId: 'string',
          status: 'NO_VERIFICADO'
        })
        .expect(201);
      owner = ownerResponse.body;
    });

    it('Verifica un propietario', async() => {
      await request(app)
        .put(`/owners/${owner.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          type: 'PRINCIPAL',
          status: 'VERIFICADO',
          verified: true
        })
        .expect(204);

      const ownerRepo = new OwnerRepository();
      const updated = await ownerRepo.findById(owner.id);
      updated.status.should.be.equal('VERIFICADO');
    });

    it('Crea una meeting', async() => {
      await request(app)
        .post('/scheduled-events/meeting')
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          'notifyTo': 'no-existe',
          'event': {
            'contactId': 'no-existe',
            'ownerId': owner.id,
            'buildingId': 'no-existe',
            'worksheetId': queueItems[0].worksheetId,
            'eventAddress': 'Over here',
            'eventLocation': {
              'lat': 0,
              'long': 0
            }
          },
          'notifyAt': new Date().toJSON(),
          'eventDate': new Date('2018-02-28T16:30:00Z').toJSON()
        })
        .expect(201);
    });

    it('Crea otra meeting', async() => {
      await request(app)
        .post('/scheduled-events/meeting')
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          'notifyTo': 'no-existe',
          'event': {
            'contactId': 'no-existe',
            'ownerId': owner.id,
            'buildingId': 'no-existe',
            'worksheetId': queueItems[0].worksheetId,
            'eventAddress': 'Over here',
            'eventLocation': {
              'lat': 0,
              'long': 0
            }
          },
          'notifyAt': new Date().toJSON(),
          'eventDate': new Date('2018-02-28T19:30:00Z').toJSON()
        })
        .expect(201);
    });

    it('Libera un item abierto', async() => {
      return request(app)
        .post(`/worksheets/queues/${_queue.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          queueItemId: queueItems[0].id,
          action: 'RELEASE'
        })
        .expect(204);
    });

    it('Contamos acciones', async() => {
      const result = await request(app)
        .get('/stats')
        .set('Authorization', authenticatedManager.authorization)
        .send()
        .expect(200);

      const expected = JSON.stringify({
        callsMade: 0,
        callsAnswered: 0,
        verifiedOwners: 1,
        meetingsMade: 2
      });
      const actual = JSON.stringify(result.body[0].counters);
      actual.should.be.equal(expected);
    });
  });
});
