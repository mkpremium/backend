import request from 'supertest';
import app from '../../src/app';

export class WorksheetBuildingHelper {
  static async createBuildingWithWorksheetViaApi(authenticated, payload) {
    return request(app)
      .post('/worksheets/buildings')
      .set('Authorization', authenticated.authorization)
      .expect(201)
      .send(payload)
      .then(r => r.body);
  }
}
