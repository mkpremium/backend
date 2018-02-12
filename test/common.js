import request from 'supertest';
import {OperatorRepository} from '../src/operator/models';

export async function operatorLogin(app, credentials = {username: 'admin', password: 'password'}) {
  const response = await request(app)
    .post('/operator/login')
    .send(credentials)
    .expect(200);

  return Object.assign({}, response.body, {authorization: `Bearer ${response.body.token}`});
}

export async function operatorCreateAdmin() {
  const repo = new OperatorRepository();
  return repo.save({
    username: 'admin',
    password: 'password',
    agentNumber: 'admin',
    roles: [
      'ADMIN'
    ],
    profile: {
      firstName: 'admin',
      lastName: 'operator'
    }
  });
}

export async function operatorCreate() {
  const repo = new OperatorRepository();
  return repo.save({
    username: 'operator',
    password: 'password',
    agentNumber: 'operator',
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'operator',
      lastName: 'operator'
    }
  });
}
