import Promise from 'bluebird';
import app from '../src/app';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';

function reIndex(worksheet) {
  const repo = new WorksheetRepository();
  return repo.save(worksheet, false);
}

async function init() {
  await app.locals.bucketPromise;

  const repo = new WorksheetRepository();
  const worksheets = await repo.query();

  await Promise.mapSeries(worksheets, reIndex);
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
