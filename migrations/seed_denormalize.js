import Promise from 'bluebird';
import couchbase from '../src/db/couchbase';
import t from 'tcomb';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {BuildingRepository} from '../src/building/models';

async function seedDenormalize() {
  await couchbase();
  await denormalizeWorksheets();
}

export async function denormalizeWorksheets() {
  const repo = new WorksheetRepository();

  const worksheets = await repo.query();
  await Promise.map(worksheets, processWorksheet, {concurrency: 2});
}

async function processWorksheet(worksheet) {
  const worksheetRepo = new WorksheetRepository();
  const repo = new BuildingRepository();
  const [buildingId] = worksheet.relatedBuildingIds;
  if (!buildingId) {
    return;
  }

  const building = await repo.findByIdOrThrow(buildingId);
  const updatedWorksheet = t.update(worksheet, {buildingAddress: {$set: building.address}});
  await worksheetRepo.save(updatedWorksheet, false);
}

if (require.main === module) {
  seedDenormalize()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
