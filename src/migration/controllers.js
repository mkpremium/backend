import {resolve, join} from 'path';
import {wrap} from 'express-promise-wrap';
import models from './models';
import {csvToJson} from './lib';

function createList(name) {
  return wrap(async(req, res) => {
    const data = await req.app.locals.bucket.getList(name);
    res.json({data});
  });
}

function createImport(name) {
  return wrap(async(req, res) => {
    const model = models[name](req.body);
    console.log('importing', name, model.id);
    await req.app.locals.bucket.upsertToDb(model.id, model);
    res.status(204).json();
  });
}

const csvBasePath = resolve(__dirname, '../../test/fixtures');
const csvMapNames = {
  'building': 'EDIFICIOS.csv',
  'history': 'HISTORIAL.csv',
  'worksheet': 'LLAMADAS.csv',
  'operator': 'OPERADORES.csv',
  'person': 'PERSONAS.csv',
  'owner': 'PROPIETARIOS.csv',
  'housestate': 'SITARR.csv'
};

function createBulkImport(name) {
  return wrap(async(req, res) => {
    if (csvMapNames[name]) {
      throw new Error(`${name} not found on csvMapNames`);
    }

    async function processFunc(data) {

    }

    const filename = join(csvBasePath, csvMapNames[name]);
    await csvToJson(filename, processFunc);
    res.status(204).json();
  });
}

export const createListController = createList;
export const createImportController = createImport;
export const createBulkImportController = createBulkImport;
