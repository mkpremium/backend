import Promise from 'bluebird';
import request from 'supertest';
import {OperatorRefreshTokenRepository, OperatorRepository} from '../src/operator/models';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';
import {OwnerRepository, PersonRepository} from '../src/owner/models';
import {Calls, CallsRawEvents} from '../src/calls/models';
import {History} from '../src/history/models';
import {ScheduledEventsRepository} from '../src/scheduled-events/models';
import {BuildingRepository} from '../src/building/models';
import {OperatorStats} from '../src/stats/models';
import {CityRepository, NeighborhoodRepository} from '../src/street/models';
import {cleanFirebase} from '../migrations/firebase-clean';
import {cleanQueue} from '../cli/lib/migrate-utils';
import {CadastreRepository} from '../src/cadastre/models';
import {StockRepository} from '../src/stock/models';

export async function deleteAll() {
  const operator = new OperatorRepository();
  const worksheet = new WorksheetRepository();
  const queue = new WorksheetQueueRepository();
  const people = new PersonRepository();
  const owner = new OwnerRepository();
  const history = new History();
  const calls = new Calls();
  const callUnknownEvents = new CallsRawEvents();
  const scheduledEvent = new ScheduledEventsRepository();
  const building = new BuildingRepository();
  const stats = new OperatorStats();
  const neighborhood = new NeighborhoodRepository();
  const city = new CityRepository();
  const cadastre = new CadastreRepository();
  const refresh = new OperatorRefreshTokenRepository();
  const stock = new StockRepository();
  await OperatorRepository._promiseBucket;

  return Promise.all([
    cleanFirebase(),
    operator.deleteQuery(),
    worksheet.deleteQuery(),
    queue.deleteQuery(),
    people.deleteQuery(),
    owner.deleteQuery(),
    building.deleteQuery(),
    history.deleteQuery(),
    calls.deleteQuery(),
    scheduledEvent.deleteQuery(),
    callUnknownEvents.deleteQuery(),
    stats.deleteQuery(),
    neighborhood.deleteQuery(),
    city.deleteQuery(),
    cadastre.deleteQuery(),
    refresh.deleteQuery(),
    stock.deleteQuery(),
    cleanQueue()
  ]);
}

export async function operatorLogin(app, credentials = {username: 'admin', password: 'Passw0rd'}) {
  const response = await request(app)
    .post('/operators/login')
    .send(credentials)
    .expect(200);

  return Object.assign({}, response.body, {authorization: `Bearer ${response.body.token}`});
}

export async function createFullOperator(object) {
  const repo = new OperatorRepository();
  return repo.save(object, false);
}

export async function operatorCreate(index = '', queueId) {
  return createFullOperator({
    username: `operator${index}`,
    password: 'Passw0rd',
    agentNumber: `operator${index}`,
    roles: [
      'OPERATOR'
    ],
    profile: {
      queueId,
      firstName: 'operator',
      lastName: 'operator',
      city: 'barcelona',
      email: 'operator@example.com'
    }
  });
}

export async function operatorCreateAdmin(queueId) {
  return createFullOperator({
    username: 'admin',
    password: 'Passw0rd',
    agentNumber: 'admin',
    roles: [
      'ADMIN'
    ],
    profile: {
      queueId,
      firstName: 'admin',
      lastName: 'operator',
      city: 'barcelona'
    }
  });
}

export async function operatorCreateStreet() {
  return createFullOperator({
    username: 'street',
    password: 'Passw0rd',
    agentNumber: 'street',
    roles: [
      'STREET'
    ],
    profile: {
      firstName: 'street',
      lastName: 'operator',
      city: 'barcelona',
      neighborhood: 'VALLCARCA I ELS PENITENTS'
    }
  });
}

export async function operatorCreateBusiness() {
  return createFullOperator({
    username: 'business',
    password: 'Passw0rd',
    agentNumber: 'business',
    roles: [
      'BUSINESS'
    ],
    profile: {
      firstName: 'business',
      lastName: 'operator',
      city: 'barcelona'
    }
  });
}

export async function operatorCreateManager(queueId) {
  return createFullOperator({
    username: 'manager',
    password: 'Passw0rd',
    agentNumber: 'manager',
    roles: [
      'MANAGER'
    ],
    profile: {
      queueId,
      firstName: 'manager',
      lastName: 'operator',
      city: 'barcelona'
    }
  });
}

export async function operatorCreateStreetManager() {
  return createFullOperator({
    username: 'street_manager',
    password: 'Passw0rd',
    agentNumber: 'street_manager',
    roles: [
      'STREET_MANAGER'
    ],
    profile: {
      firstName: 'street_manager',
      lastName: 'operator',
      city: 'barcelona'
    }
  });
}

export const defaultPassword = 'Passw0rd';
