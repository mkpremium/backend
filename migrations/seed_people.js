import csv from 'csvtojson';
import couchbase from '../src/db/couchbase';
import {readCodigosPostalesMunicipios} from '../csv/codigos_postales_municipios';
import {resolve} from 'path';
import migrateFromCsv from '../src/migration/models/person';
import {PersonRepository} from '../src/owner/models';

import {defer} from '../src/lib/promise-util';

async function init(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };

  const people = new PersonRepository();
  await people.deleteQuery();

  await processPeople(files, app);
}

async function processPeople({people}, app) {
  const codes = await readCodigosPostalesMunicipios();
  return csvToJSON(people, async function(row) {
    let person = migrateFromCsv(row, codes);
    await app.locals.bucket.upsertToDb(person.id, person);
    person = null;
  });
}

// eslint-disable-next-line no-unused-vars
async function initDump(files) {

  await processPeople(files);
}

// eslint-disable-next-line no-unused-vars
async function processPeopleDump({people}) {
  let count = 0;
  const {promise} = defer();
  csvToJSON(people, async function() {
    count++;
    if (count % 100000 === 0) {
      heapdump.writeSnapshot();
    }
  });

  return promise;
}

const defaultFiles = {
  people: resolve(__dirname, '../csv/PERSONAS.csv')
};

if (require.main === module) {
  init(defaultFiles)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

const defaultOptions = {
  delimiter: ';',
  fork: true,
  workerNum: 8
};

const noOp = () => {
};

async function csvToJSON(filepath, processFunc = noOp, options = defaultOptions) {
  return csv(options)
    .fromFile(filepath)
    .subscribe(processFunc);
}
