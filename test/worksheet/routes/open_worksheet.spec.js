import t from 'tcomb';
import Promise from 'bluebird';
import request from 'supertest';
import times from 'lodash/times';
import app from '../../../src/app';

import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';

describe('worksheet.routes', () => {
  let queueItems = [];
  before(async() => {
    await app.locals.bucketPromise;

    const worksheetRepo = new WorksheetRepository();
    const worksheetQueueRepo = new WorksheetQueueRepository();

    await worksheetRepo.deleteQuery();
    await worksheetQueueRepo.deleteQuery();

    const queue = await worksheetQueueRepo.save({city: 'madrid'});
    const worksheets = await Promise.all(times(5, () => worksheetRepo.save({})));

    queueItems = await Promise.map(worksheets, async(worksheet) => worksheetQueueRepo.addWorksheet(queue, worksheet));

    const updatedQueue = t.update(queue, {worksheets: {$set: queueItems}});
    await worksheetQueueRepo.save(updatedQueue);
  });

  describe('queue.routes', () => {
    describe('POST /worksheets/queues/:city @request', () => {
      it('200 Abre y Obtiene la ficha con éxito', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .send({queueItemId: queueItems[0].id})
          .expect(200);
      });
      it('404 Ciudad no encontrada', async() => {
        return request(app)
          .post('/worksheets/queues/barranquilla')
          .send({queueItemId: queueItems[0].id})
          .expect(404);
      });

      it('400 El item no existe en la cola', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .send({queueItemId: 'no-existe'})
          .expect(400);
      });

      it('409 El item no esta disponible para su apertura', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .send({queueItemId: queueItems[0].id})
          .expect(409);
      });
    });
  });
});
