import request from 'supertest';
import app from '../../../src/app';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';
import {deleteAll, operatorCreate, operatorCreateAdmin, operatorCreateManager, operatorLogin} from '../../common';

describe('worksheet.routes', () => {
  let authenticatedOperator;
  let authenticatedAdmin;
  before(async() => {
    await deleteAll();
    const repo = new WorksheetQueueRepository();
    await repo.save({
      city: 'barcelona'
    });
    await operatorCreate(app);
    await operatorCreateManager(app);
    await operatorCreateAdmin(app);
    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
    authenticatedAdmin = await operatorLogin(app, {username: 'admin', password: 'password'});
  });
  describe('queue.routes', () => {
    describe('GET /worksheets/queues/:city @request', () => {
      it('200 Devuelve cola de fichas de trabajo', async() => {
        return request(app)
          .get('/worksheets/queues/barcelona')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200);
      });

      it('404 Ciudad no encontrada', async() => {
        return request(app)
          .get('/worksheets/queues/barranquilla')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(404);
      });
    });
    describe('GET /worksheets/queues @request', () => {
      it('200 Lista las colas', async() => {
        return request(app)
          .get('/worksheets/queues')
          .set('Authorization', authenticatedAdmin.authorization)
          .expect(200);
      });
    });
  });
});
