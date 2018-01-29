import minimist from 'minimist';

import {csvToJson} from '../lib';
import models from '../models';

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

async function importCsv(name, filename) {
  if (typeof models[name] !== 'function') {
    throw new Error(`Model ${name}.migrateFromCsv() not found nor correctly exported`);
  }
  await csvToJson(filename, processFunc);
}

function processFunc(data, row) {
  try {
    models[model](data);
  } catch (e) {
    console.error(e.message, 'at', row, data);
    throw e;
  }
}

importCsv(model, file)
  .catch(console.error.bind(console));
