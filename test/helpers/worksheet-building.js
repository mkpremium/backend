import request from 'supertest';
import app from '../../src/app';

export class WorksheetBuildingHelper {
  static async createBuildingWithWorksheetViaApi(authenticated, payload, statusCode = 201) {
    return request(app)
      .post('/worksheets/buildings')
      .set('Authorization', authenticated.authorization)
      .expect(statusCode)
      .send(payload)
      .then(r => r.body);
  }
}
