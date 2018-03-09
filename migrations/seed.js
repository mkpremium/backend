import t from 'tcomb';
import Promise from 'bluebird';
import times from 'lodash/times';

import app from '../src/app';

import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {
  createFullOperator, deleteAll, operatorCreate, operatorCreateAdmin,
  operatorCreateManager
} from '../test/common';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';
import {OwnerRepository, PersonRepository} from '../src/owner/models';
import {BuildingRepository} from '../src/building/models';

async function init() {
  await app.locals.bucketPromise;
  await deleteAll();
  await createFullOperator({
    username: `bitdistrict`,
    password: 'bitdistrict',
    agentNumber: `10106-905`,
    serviceId: '17146',
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'Bitdistrict',
      lastName: 'dev',
      city: 'barcelona'
    }
  });
  await operatorCreate();
  await operatorCreateAdmin();
  await operatorCreateManager();
  const migrateOwner = new MigrateModel('owner', resolve(__dirname, '../test/fixtures/sample_owners.csv'), app);
  await migrateOwner.run();

  const migrateBuildings = new MigrateModel('building', resolve(__dirname, '../test/fixtures/sample_buildings.csv'), app);
  await migrateBuildings.run();

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
  const queue = await worksheetQueueRepo.save({city: 'barcelona'});
  const people = await personRepo.query();
  const worksheets = await Promise
    .all(times(ownersWithBuildings.length, () => {
      const owner = getOneOwner();
      return worksheetRepo.save({
        relatedOwnerIds: owner.map(({id}) => id),
        relatedBuildingIds: owner.map(({buildingId}) => buildingId)
      });
    }));
  const queueItems = await Promise
    .map(worksheets, async(worksheet) => worksheetQueueRepo.addWorksheet(queue, worksheet));

  const updatedQueue = t.update(queue, {worksheets: {$set: queueItems}});
  await worksheetQueueRepo.save(updatedQueue);

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
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
