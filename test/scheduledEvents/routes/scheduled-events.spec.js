import request from 'supertest';
import Promise from 'bluebird';
import intersectionBy from 'lodash/intersectionBy';
import times from 'lodash/times';
import app from '../../../src/app';
import {ScheduledEventsRepository} from '../../../src/scheduledEvents/models';
import {deleteAll, operatorCreate, operatorLogin} from '../../common';

describe('scheduledevents.routes', () => {
  let authenticatedOperator;
  let scheduledEventObject;
  let scheduledEventToBeUpdated;
  before(async() => {
    await deleteAll();
    await operatorCreate();
    const scheduledEventRepo = new ScheduledEventsRepository();
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    
    scheduledEventObject = {
      userId: authenticatedOperator.operator.id,
      type: 'CALLS',
      data: {from: 'test', to: 'test'},
      notifyAt: new Date('2018-02-28T16:24:00Z')
    };

    await Promise.all(times(49, () => scheduledEventRepo.save(scheduledEventObject)));
    scheduledEventToBeUpdated = await scheduledEventRepo.save(scheduledEventObject);
  });

  describe('GET /scheduled-events @request', () => {
    describe('200 Operación exitosa', () => {
      it('returns by default 20 items max', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(50);
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
        response.body.total.should.equal(50);
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
        responseLimit.body.total.should.equal(50);
        responseLimit.body.results.should.be.a('array');
        responseLimit.body.results.should.have.length(10);

        responseOffsetLimit.body.should.be.a('object');
        responseOffsetLimit.body.total.should.equal(50);
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
          .query({createdBetween: '1989-12-27,2018-12-31'})
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(50);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });

      it('Mixed query param', async() => {
        const response = await request(app)
          .get('/scheduled-events')
          .set('Authorization', authenticatedOperator.authorization)
          .query({
            userId: authenticatedOperator.operator.id,
            createdBetween: '1989-12-27,2018-12-31'
          })
          .expect(200);
        response.body.should.be.a('object');
        response.body.total.should.equal(50);
        response.body.results.should.be.a('array');
        response.body.results.should.have.length(20);
      });
    });
  });

  describe('POST /scheduled-events @request', () => {
    it('201 Operación exitosa', async() => {
      await request(app)
        .post('/scheduled-events')
        .set('Authorization', authenticatedOperator.authorization)
        .send(scheduledEventObject)
        .expect(201);
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
