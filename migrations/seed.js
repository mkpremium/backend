import t from 'tcomb';
import Promise from 'bluebird';
import _times from 'lodash/times';

import app from '../src/app';

import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {
  createFullOperator, deleteAll, operatorCreate, operatorCreateAdmin, operatorCreateBusiness,
  operatorCreateManager, operatorCreateStreet, operatorCreateStreetManager
} from '../test/common';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';
import {OwnerRepository, PersonRepository} from '../src/owner/models';
import {BuildingRepository} from '../src/building/models';
import {cleanFirebase} from './firebase-clean';

async function init() {
  await app.locals.bucketPromise;
  await deleteAll();
  await cleanFirebase();
  const migrateOwner = new MigrateModel('owner', resolve(__dirname, '../test/fixtures/sample_owners.csv'), app);
  await migrateOwner.run();

  const migrateBuildings = new MigrateModel('building', resolve(__dirname, '../test/fixtures/sample_buildings.csv'), app);
  await migrateBuildings.run();

  const migrateNeighborhoods = new MigrateModel('neighborhood', resolve(__dirname, '../csv/Barrios.csv'), app, {delimiter: ','});
  await migrateNeighborhoods.run();
  const migrateCity = new MigrateModel('city', resolve(__dirname, '../csv/Ciudad.csv'), app, {delimiter: ','});
  await migrateCity.run();

  const personRepo = new PersonRepository();
  const ownerRepo = new OwnerRepository();
  const buildingRepo = new BuildingRepository();
  const owners = await ownerRepo.query();
  const buildings = await buildingRepo.query();

  const ownersForBuildings = owners.slice(0, buildings.length);

  const ownersWithBuildings = await Promise.all(ownersForBuildings.map((owner, index) => {
    const updatedOwner = t.update(owner, {buildingId: {$set: buildings[index].id}});
    return ownerRepo.save(updatedOwner);
  }));

  const getOneOwner = () => {
    const owner = ownersWithBuildings.pop();
    if (owner) {
      return [owner];
    } else {
      return [];
    }
  };

  const worksheetRepo = new WorksheetRepository();
  const worksheetQueueRepo = new WorksheetQueueRepository();
  const queue = await worksheetQueueRepo.save({
    name: 'barcelona',
    source: {
      city: 'BARCELONA'
    }
  });
  const people = await personRepo.query();
  const worksheets = await Promise
    .all(_times(ownersWithBuildings.length, () => {
      const owner = getOneOwner();
      return worksheetRepo.save({
        relatedOwnerIds: owner.map(({id}) => id),
        relatedBuildingIds: owner.map(({buildingId}) => buildingId)
      });
    }));
  await Promise.mapSeries(worksheets, worksheet => worksheetQueueRepo.addWorksheet(queue.id, worksheet.id));

  const Contacts = t.list(t.TypedContactInfo);

  await Promise.map(people, async(person) => {
    const contacts = Contacts([
      {
        'status': 'UNDEFINED',
        'type': 'TELEFONO',
        'value': '649169005'
      },

      {
        'status': 'UNDEFINED',
        'type': 'TELEFONO',
        'value': '633759398'
      }
    ]);
    const personWithContacts = t.update(person, {contacts: {$set: contacts}});
    return personRepo.save(personWithContacts);
  });

  await createFullOperator({
    username: `bitdistrict`,
    password: 'bitdistrict',
    agentNumber: `10106-919`,
    serviceId: '17146',
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'Bitdistrict',
      lastName: 'dev',
      city: ['barcelona'],
      queueId: queue.id
    }
  });
  await operatorCreate('', queue.id);
  await operatorCreateAdmin(queue.id);
  await operatorCreateManager(queue.id);
  await operatorCreateBusiness();
  await operatorCreateStreet();
  await operatorCreateStreetManager();
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
