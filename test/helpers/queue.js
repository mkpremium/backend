import request from 'supertest';
import app from '../../src/app';
import _ from 'lodash';
import {WorksheetQueueRepository} from '../../src/worksheet/models/queue';

export async function createQueueEndpoint(authenticatedManager, payload) {
  const defaultData = _.extend({
    name: 'queue-' + new Date().getTime(),
    source: {
      city: 'BARCELONA'
    }
  }, payload);

  return request(app)
    .post(`/worksheets/queues`)
    .set('Authorization', authenticatedManager.authorization)
    .send(defaultData)
    .expect(201)
    .then(response => {
      return response.body;
    });
}

export async function doActionInQueueEndpoint(authenticatedManagerOrOperator, queueId, payload, expectedCode = 200) {
  const defaultPayload = {
    action: 'NEXT'
  };

  return request(app)
    .post(`/worksheets/queues/${queueId}`)
    .set('Authorization', authenticatedManagerOrOperator.authorization)
    .send(payload || defaultPayload)
    .expect(expectedCode)
    .then(response => {
      return response.body;
    })
    .catch(error => console.log('Error endpoint: ', error));
}

export async function findByIdModel(queueId) {
  const worksheetQueueRepository = new WorksheetQueueRepository();

  return worksheetQueueRepository.findByIdOrThrow(queueId);
}

export async function cleanWorksheetsNotInQueueViaModel(queueId) {
  const worksheetQueueRepository = new WorksheetQueueRepository();

  return worksheetQueueRepository.freeNotInQueueWorksheets(queueId);
}

export async function cleanAllWorksheetsNotInQueueViaModel() {
  const worksheetQueueRepository = new WorksheetQueueRepository();

  return worksheetQueueRepository.cleanAllWorksheetsNotInQueue();
}
