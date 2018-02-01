import request from 'supertest';

import app from '../../../src/app';
import {Operator} from '../../../src/operator/models';

describe('operator.routes', () => {
  before(async function() {
    this.timeout(10000);
    await app.locals.bucketPromise;
    const operator = new Operator();
    const qb = operator.getQueryBuilder('delete').where('username = ?', 'operator2');
    await operator.query(qb);
  });

  describe('POST /operator @request', () => {
    it('201 Operador creado', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operator')
        .send({
          username: 'operator2',
          password: 'Passw0rd',
          agentNumber: 'operator2',
          roles: [
            'OPERATOR'
          ],
          profile: {
            firstName: 'Operator',
            lastName: 'Doe'
          }
        })
        .expect(201);
      response.body.should.be.a('object');
      response.body.should.have.a.property('id');
    });

    it('400 Solicitud invalida', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operator')
        .send({
          username: 'operator1',
          password: 'Passw0rd1'
        })
        .expect(400);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });

    it('400 Solicitud invalida (username único)', async() => {
      const requester = request(app);
      const response = await requester
        .post('/operator')
        .send({
          username: 'operator2',
          password: 'Passw0rd',
          agentNumber: 'operator2',
          roles: [
            'OPERATOR'
          ],
          profile: {
            firstName: 'Operator',
            lastName: 'Doe'
          }
        })
        .expect(400);
      response.body.should.be.a('object');
      response.body.should.have.a.property('message');
    });
  });
}).timeout(10000);
