import Promise from 'bluebird';
import request from 'supertest';
import {OperatorRepository} from '../src/operator/models';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';
import {OwnerRepository, PersonRepository} from '../src/owner/models';
import {Calls} from '../src/calls/models';
import {History} from '../src/history/models';
import {ScheduledEventsRepository} from '../src/scheduledEvents/models';

export async function deleteAll() {
  const operator = new OperatorRepository();
  const worksheet = new WorksheetRepository();
  const queue = new WorksheetQueueRepository();
  const people = new PersonRepository();
  const owner = new OwnerRepository();
  const history = new History();
  const calls = new Calls();
  const scheduledEvent = new ScheduledEventsRepository();

  return Promise.all([
    operator.deleteQuery(),
    worksheet.deleteQuery(),
    queue.deleteQuery(),
    people.deleteQuery(),
    owner.deleteQuery(),
    history.deleteQuery(),
    calls.deleteQuery(),
    scheduledEvent.deleteQuery(),
    calls.deleteQuery()
  ]);
}

export async function operatorLogin(app, credentials = {username: 'admin', password: 'password'}) {
  const response = await request(app)
    .post('/operators/login')
    .send(credentials)
    .expect(200);

  return Object.assign({}, response.body, {authorization: `Bearer ${response.body.token}`});
}

export async function operatorCreate(index = '') {
  const repo = new OperatorRepository();
  return repo.save({
    username: `operator${index}`,
    password: 'password',
    agentNumber: `operator${index}`,
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'operator',
      lastName: 'operator'
    }
  });
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

export async function operatorCreateManager() {
  const repo = new OperatorRepository();
  return repo.save({
    username: 'manager',
    password: 'password',
    agentNumber: 'manager',
    roles: [
      'MANAGER'
    ],
    profile: {
      firstName: 'manager',
      lastName: 'operator'
    }
  });
}
