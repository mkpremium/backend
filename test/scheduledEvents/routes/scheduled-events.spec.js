import request from 'supertest';
import Promise from 'bluebird';
import intersectionBy from 'lodash/intersectionBy';
import times from 'lodash/times';
import app from '../../../src/app';
import {ScheduledEventsRepository} from '../../../src/scheduledEvents/models';
import {deleteAll, operatorCreate, operatorLogin} from '../../common';

describe('scheduledevents.routes', () => {
  let authenticatedOperator;
  let scheduledMeetingsEventObject;
  let scheduledCallsEventObject;
  let scheduledEventToBeUpdated;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    const scheduledEventRepo = new ScheduledEventsRepository();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});

    scheduledMeetingsEventObject = {
      type: 'MEETINGS',
      notifyAt: new Date('2018-05-28T16:24:00Z'),
      notifyTo: authenticatedOperator.operator.id,
      event: {
        ownerId: 'not-exist-in-db',
        buildingId: 'not-exist-in-db'
      }
    };

    scheduledCallsEventObject = {
      notifyTo: authenticatedOperator.operator.id,
      type: 'CALLS',
      notifyAt: new Date('2018-02-28T16:24:00Z'),
      eventDate: new Date('2018-02-29T16:24:00Z'),
      event: {
        contactId: 'not-exist-in-db',
        worksheetId: 'not-exist-in-db',
        buildingId: 'not-exist-in-db'
      }
    };

    await Promise.all(times(49, () => scheduledEventRepo.save(scheduledCallsEventObject)));
    scheduledEventToBeUpdated = await scheduledEventRepo.save(scheduledCallsEventObject);

    scheduledMeetingsEventObject.eventDate = new Date('2018-01-05T16:00:00Z');
    await Promise.all(times(3, () => scheduledEventRepo.save(scheduledMeetingsEventObject)));
    scheduledMeetingsEventObject.eventDate = new Date('2018-02-05T16:00:00Z');
    await Promise.all(times(3, () => scheduledEventRepo.save(scheduledMeetingsEventObject)));
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

      it('get scheduled MEETINGS between 2018-01-01 and 2018-02-01', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({type: 'MEETINGS', eventDateBetween: '2018-01-01,2018-02-01'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(3);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(3);
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
    it('201 Operación exitosa', async() => {
      const response = await request(app)
        .post('/scheduled-events/call')
        .set('Authorization', authenticatedOperator.authorization)
        .send(scheduledCallsEventObject);
      console.log(response.body);
      response.status.should.equal(201);
    });
  });

  describe('PUT /scheduled-events/:id @request', () => {
    it('204 Operación exitosa', async() => {
      await request(app)
        .put(`/scheduled-events/${scheduledEventToBeUpdated.id}`)
        .set('Authorization', authenticatedOperator.authorization)
        .send({type: 'MEETINGS', data: {}, notifyAt: new Date('2018-02-28T16:24:39Z')})
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
