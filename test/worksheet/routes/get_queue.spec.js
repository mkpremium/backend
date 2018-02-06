import Promise from 'bluebird';
import request from 'supertest';
import app from '../../../src/app';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';

describe('worksheet.routes', () => {
  before(async() => {
    await app.locals.bucketPromise;
    const repo = new WorksheetQueueRepository();
    await repo.deleteQuery();
    await repo.save({
      city: 'barcelona'
    });
    await Promise.delay(1000);
  });
  describe('queue.routes', () => {
    describe('GET /worksheets/queues/:city @request', () => {
      it('200 Devuelve cola de fichas de trabajo', async() => {
        return request(app)
          .get('/worksheets/queues/barcelona')
          .expect(200);
      });

      it('404 Ciudad no encontrada', async() => {
        return request(app)
          .get('/worksheets/queues/barranquilla')
          .expect(404);
      });
    });
    describe('GET /worksheets/queues @request', () => {
      it('200 Lista las colas', async() => {
        return request(app)
          .get('/worksheets/queues')
          .expect(200);
      });
    });
  });
});
