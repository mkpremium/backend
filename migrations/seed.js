import t from 'tcomb';
import Promise from 'bluebird';
import times from 'lodash/times';

import app from '../src/app';

import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {deleteAll, operatorCreate, operatorCreateAdmin, operatorCreateManager} from '../test/common';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';
import {OwnerRepository} from '../src/owner/models';
import {BuildingRepository} from '../src/building/models';

async function init() {
  await app.locals.bucketPromise;
  await deleteAll();
  await operatorCreate();
  await operatorCreateAdmin();
  await operatorCreateManager();
  const migrateOwner = new MigrateModel('owner', resolve(__dirname, '../test/fixtures/sample_owners.csv'), app);
  await migrateOwner.run();

  const migrateBuildings = new MigrateModel('building', resolve(__dirname, '../test/fixtures/sample_buildings.csv'), app);
  await migrateBuildings.run();

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
      return [owner.id];
    } else {
      return [];
    }
  };

  const worksheetRepo = new WorksheetRepository();
  const worksheetQueueRepo = new WorksheetQueueRepository();
  const queue = await worksheetQueueRepo.save({city: 'barcelona'});
  const worksheets = await Promise
    .all(times(ownersWithBuildings.length, () => worksheetRepo.save({relatedOwnerIds: getOneOwner()})));
  const queueItems = await Promise
    .map(worksheets, async(worksheet) => worksheetQueueRepo.addWorksheet(queue, worksheet));

  const updatedQueue = t.update(queue, {worksheets: {$set: queueItems}});
  await worksheetQueueRepo.save(updatedQueue);
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
