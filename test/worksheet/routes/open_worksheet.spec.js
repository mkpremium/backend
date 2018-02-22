import t from 'tcomb';
import Promise from 'bluebird';
import request from 'supertest';
import times from 'lodash/times';
import app from '../../../src/app';

import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';
import {deleteAll, operatorCreate, operatorLogin} from '../../common';

describe('worksheet.routes', () => {
  let queueItems = [];
  let authenticatedOperator;
  before(async() => {
    const worksheetRepo = new WorksheetRepository();
    const worksheetQueueRepo = new WorksheetQueueRepository();

    await deleteAll();
    await operatorCreate();

    const queue = await worksheetQueueRepo.save({city: 'madrid'});
    const worksheets = await Promise.all(times(5, () => worksheetRepo.save({})));

    queueItems = await Promise.map(worksheets, async(worksheet) => worksheetQueueRepo.addWorksheet(queue, worksheet));

    const updatedQueue = t.update(queue, {worksheets: {$set: queueItems}});
    await worksheetQueueRepo.save(updatedQueue);

    authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'password'});
  });

  describe('queue.routes', () => {
    describe('POST /worksheets/queues/:city @request', () => {
      it('200 Toma el item de la cola', async() => {
        await request(app)
          .post('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .send({queueItemId: queueItems[0].id})
          .expect(200);

        const response = await request(app)
          .get('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200);
        const openedWorksheets = response.body.worksheets.filter(w => w.status === 'OPENED');
        openedWorksheets.should.have.length(1);
        const [openedWorksheet] = openedWorksheets;
        openedWorksheet.should.have.a.property('operatorId');
        openedWorksheet.operatorId.should.be.equal(authenticatedOperator.operator.id);
      });

      it('200 Una hoja puede ser obtenida despues de abierta', async() => {
        await request(app)
          .get(`/worksheets/${queueItems[0].worksheetId}`)
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200);
      });

      it('404 Ciudad no encontrada', async() => {
        return request(app)
          .post('/worksheets/queues/barranquilla')
          .set('Authorization', authenticatedOperator.authorization)
          .send({queueItemId: queueItems[0].id})
          .expect(404);
      });

      it('400 El item no existe en la cola', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .send({queueItemId: 'no-existe'})
          .expect(400);
      });

      it('409 El item no esta disponible para ser tomado', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .send({queueItemId: queueItems[0].id})
          .expect(409);
      });

      it('204 Libera un item abierto', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            queueItemId: queueItems[0].id,
            action: 'RELEASE'
          })
          .expect(204);
      });

      it('200 Despues de liberarse puede tomarse de nuevo el item', async() => {
        const response = await request(app)
          .post('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            queueItemId: queueItems[0].id
          })
          .expect(200);
        response.body.should.be.a('object');
        response.body.should.have.a.property('relatedOwners');
        response.body.relatedOwners.should.be.a('array');
      });

      it('409 No puede tomar mas de un item', async() => {
        return request(app)
          .post('/worksheets/queues/madrid')
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            queueItemId: queueItems[1].id
          })
          .expect(409);
      });
    });
  });
});
