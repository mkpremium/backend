import minimist from 'minimist';
import debug from 'debug';
import Promise from 'bluebird';

import {csvToJson} from '../lib';
import models from '../models';
import {combineDuplicatesDocumentNumber} from '../models/owner';
import couchbase from '../../db/couchbase';

const debugBin = debug('app:bin:migration');
const options = {
  default: {},
  string: [
    'model',
    'file'
  ],
  alias: {
    f: 'file',
    m: 'model'
  }
};
const {model, file} = minimist(process.argv.slice(2), options);
const {bucket} = couchbase({middleware: false});

let migratedData = [];
let processedData = [];

async function importCsv(name, filename) {
  if (typeof models[name] !== 'function') {
    throw new Error(`Model ${name}.migrateFromCsv() not found nor correctly exported`);
  }
  debugBin('importing', filename, 'into', model);
  await csvToJson(filename, processFunc);
  debugBin('readed', migratedData.length, 'records');
  postImport();
  debugBin(processedData.length, 'after post-processing');
  debugBin('importing to db', processedData.length, 'records');
  await importToDb();
}

function postImport() {
  switch (model) {
    case 'owner':
      processedData = combineDuplicatesDocumentNumber(migratedData);
      break;
    default:
      processedData = migratedData;
      break;
  }
}

async function importToDb() {
  return Promise
    .mapSeries(processedData, migratedRecord => bucket.upsertToDb(migratedRecord.id, migratedRecord));
}

function processFunc(data, row) {
  try {
    switch (model) {
      case 'owner':
        const {person, owner} = models[model](data);
        migratedData.push(person);
        migratedData.push(owner);
        break;
      default:
        migratedData.push(models[model](data));
    }
  } catch (e) {
    console.error(e.message, 'at', row, data);
    throw e;
  }
}

importCsv(model, file)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
