import request from 'supertest';
import Promise from 'bluebird';
import intersectionBy from 'lodash/intersectionBy';
import times from 'lodash/times';
import app from '../../../src/app';
import {ScheduledEventsRepository} from '../../../src/scheduled-events/models';
import {deleteAll, operatorCreate, operatorCreateBusiness, operatorCreateManager, operatorLogin} from '../../common';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';
import {utc} from '../../../src/lib/date';
import WorksheetHelper from '../../helpers/worksheet';
import _ from 'lodash';

describe('scheduled events.routes', () => {
  const scheduledEventRepo = new ScheduledEventsRepository();
  let authenticatedOperator;
  let authenticatedManager;
  let scheduledMeetingsEventObject;
  let scheduledCallsEventObject;
  let scheduledEventToBeUpdated;
  let items;
  let queue;
  let owner;
  let worksheet;
  before(async() => {
    await deleteAll();
    await operatorCreateManager();
    //authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'Passw0rd'});
    const worksheetQueueRepo = new WorksheetQueueRepository();

    const worksheetsWithOwner = await WorksheetHelper.createWorksheetsAndOwnerWithBuilding(authenticatedManager);
    const worksheetAndOwner = _.first(worksheetsWithOwner);
    worksheet = worksheetAndOwner.worksheet;
    owner = worksheetAndOwner.owner;

    queue = await worksheetQueueRepo.save({name: 'madrid'});
    await Promise.mapSeries(worksheetsWithOwner, worksheetAndOwner =>
      worksheetQueueRepo.addWorksheetAndSave(queue.id, worksheetAndOwner.worksheet.id));

    queue = await worksheetQueueRepo.findByIdOrThrow(queue.id);
    items = queue.worksheets;

    await operatorCreate('', queue.id);
    await operatorCreateBusiness();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});

    scheduledMeetingsEventObject = {
      type: 'MEETINGS',
      notifyAt: new Date('2018-05-28T06:30:00Z'),
      eventDate: new Date('2018-05-28T06:30:00Z'),
      notifyTo: authenticatedOperator.operator.id,
      event: {
        ownerId: worksheet.relatedOwnerIds[0],
        contactId: 'not-exist-in-db',
        worksheetId: worksheet.id,
        buildingId: worksheet.relatedBuildingIds[0],
        eventLocation: {
          lat: 0,
          long: 0
        },
        eventAddress: 'no exists'
      }
    };

    scheduledCallsEventObject = {
      notifyTo: authenticatedOperator.operator.id,
      type: 'CALLS',
      notifyAt: new Date('2018-02-28T16:24:00Z'),
      eventDate: new Date('2018-02-29T16:24:00Z'),
      event: {
        contactId: 'not-exist-in-db',
        worksheetId: worksheet.id,
        buildingId: worksheet.relatedBuildingIds[0]
      }
    };

    await Promise.all(times(49, () => scheduledEventRepo.save(scheduledCallsEventObject)));
    scheduledEventToBeUpdated = await scheduledEventRepo.save(scheduledCallsEventObject);

    await Promise.mapSeries(times(6), (i) => {
      const params = Object.assign({}, scheduledMeetingsEventObject, {
        eventDate: utc(scheduledMeetingsEventObject.eventDate).add(i * 2, 'hours').toDate()
      });
      return scheduledEventRepo.save(params);
    });
  });

  describe('GET /scheduled-events @request', () => {
    describe('200 Operación exitosa', () => {
      it('returns by default 20 items max', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(56);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('limit query param', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({limit: 10})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(56);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(10);
      });

      it('offset query param', async() => {
        const responseLimit = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({limit: 10})
          .expect(200);

        const responseOffsetLimit = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({offset: 5, limit: 5})
          .expect(200);

        responseLimit.body.should.be.a('object');
        responseLimit.body.total.should.equal(56);
        responseLimit.body.results.should.be.a('array');
        responseLimit.body.results.should.have.length(10);

        responseOffsetLimit.body.should.be.a('object');
        responseOffsetLimit.body.total.should.equal(56);
        responseOffsetLimit.body.results.should.be.a('array');
        responseOffsetLimit.body.results.should.have.length(5);

        intersectionBy(responseLimit.body.results, responseOffsetLimit.body.results, 'id').should.have.length(5);
      });

      it('createdAt query param', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({createdAt: '1989-12-27'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(0);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(0);
      });

      it('notifyAt query param', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({notifyAt: '2018-02-28T16:24:00Z'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(50);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('createdBetween query param', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({createdBetween: '1989-12-27,2030-12-31'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(56);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('get scheduled MEETINGS', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({type: 'MEETINGS'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(6);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(6);
      });

      it('get scheduled MEETINGS between 2018-05-28 and 2018-05-29', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({type: 'MEETINGS', eventDateBetween: '2018-05-28,2018-05-29'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(6);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(6);
      });

      it('Mixed query param', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({
            type: 'MEETINGS',
            userId: authenticatedOperator.operator.id,
            createdBetween: '1989-12-27,2018-12-31'
          })
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(6);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(6);
      });
    });
  });

  describe('POST /scheduled-events @request', () => {
    it('Create call operación exitosa', async() => {
      await request(app)
        .post('/scheduled-events/call')
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          notifyTo: authenticatedOperator.operator.id,
          notifyAt: new Date('2018-05-30T16:30:00Z'),
          eventDate: new Date('2018-05-30T16:30:00Z'),
          event: {
            itemId: items[0].id,
            queueId: queue.id,
            worksheetId: items[0].worksheetId
          }
        })
        .expect(201);
    });
  });

  describe('PUT /scheduled-events/:id @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .put(`/scheduled-events/${scheduledEventToBeUpdated.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          notifyTo: authenticatedOperator.operator.id,
          notifyAt: new Date('2018-02-28T16:24:39Z'),
          eventDate: new Date('2018-02-28T16:30:39Z'),
          event: {
            ownerId: owner.id,
            eventAddress: 'Some address'
          }
        })
        .expect(204);
    });

    it('204 Operación no exitosa a la misma hora', async() => {
      await request(app)
        .put(`/scheduled-events/${scheduledEventToBeUpdated.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          notifyAt: new Date('2018-02-28T16:24:00.000Z'),
          eventDate: new Date('2018-02-28T16:24:00.000Z'),
          event: {}
        })
        .expect(204);
    });

    it('204 Operación no exitosa si los minutos no son 00/30', async() => {
      await request(app)
        .put(`/scheduled-events/${scheduledEventToBeUpdated.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({
          notifyAt: new Date('2018-02-28T16:24:39Z'),
          eventDate: new Date('2018-02-28T16:30:39Z')
        })
        .expect(204);
    });
  });

  describe('GET /scheduled-events/:id @request', () => {
    it('200 Operación exitosa', async() => {
      await request(app)
        .get(`/scheduled-events/${scheduledEventToBeUpdated.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .expect(200);
    });
  });

  describe('DELETE /scheduled-events/:id @request', () => {
    it('200 Operación exitosa', async() => {
      await request(app)
        .delete(`/scheduled-events/${scheduledEventToBeUpdated.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .expect(204);
    });
  });
});
