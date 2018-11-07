import csv from 'csvtojson';
import couchbase from '../src/db/couchbase';
import {readCodigosPostalesMunicipios} from '../csv/codigos_postales_municipios';
import migrateFromCsv from '../src/migration/models/person';

import {defer} from '../src/lib/promise-util';
import {defaultFiles} from './defaults';

async function init(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };

  await processPeople(files, app);
}

async function processPeople({people}, app) {
  console.log(people);
  const codes = await readCodigosPostalesMunicipios();
  return csvToJSON(people, async function(row) {
    let person = migrateFromCsv(row, codes);
    if (person._migrateId === '123521') {
      console.log(person);
      process.exit(0);
    }

    // await app.locals.bucket.upsertToDb(person.id, person);
    // person = null;
  });
}

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
  const {promise, resolve, reject} = defer();
  csv(options)
    .fromFile(filepath)
    .subscribe(processFunc)
    .on('done', function(err) {
      err ? reject(err) : resolve();
    });

  return promise;
}
