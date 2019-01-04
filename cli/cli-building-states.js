#!/usr/bin/env babel-node
import program from 'commander';
import {checkInputs, validateHeaders} from './lib';
import {BuildingRepository} from '../src/building/models';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {csvToJSON} from '../src/migration/lib/migrate-model-v3';
import {removeNullValue} from '../src/migration/models/models-helper';
import {WorkSheetStatus} from '../src/types/worksheet';

// ~/Descargas/ESTADOS EDIFICIOS_ ID CATASTRO (12-2008)

// region main entry
program
  .arguments('[input-dir]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  if (program.args.length === 0) {
    console.error('input-file is required');
    program.help();
  }

  main.apply(null, arguments)
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

// endregion

async function main(inputDir) {
  const inputFiles = [
    'NoVende.csv',
    'Visitas.csv',
    'YaVendido.csv'
  ];

  const files = await checkInputs(inputDir, inputFiles);

  await noSale(files['NoVende.csv']);
  await withMeeting(files['Visitas.csv']);
  await alreadySold(files['YaVendido.csv']);
}

async function noSale(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;NoVende');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.NO_SALE)(data);
  }
}

function updateWorksheetStatus(newStatus) {
  async function _updateWorksheetStatus(data) {
    const buildingMigrateId = getBuildingMigrateIdNotNull(data);
    const worksheet = await findWorksheetByMigrateId(buildingMigrateId);
    return worksheet.setStatus(newStatus);
  }

  return _updateWorksheetStatus;
}

function getBuildingMigrateIdNotNull(data) {
  const buildingMigrateId = removeNullValue(data['Id_Catastro']);
  if (buildingMigrateId === null) {
    throw new Error(`invalid ID_CATASTRO '${data['Id_Catastro']}'`);
  }
  return buildingMigrateId;
}

async function withMeeting(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;Visitare');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.MEETING)(data);
  }
}

async function alreadySold(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;Venduto');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.ALREADY_SOLD)(data);
  }
}

async function findWorksheetByMigrateId(buildingMigrateId) {
  const building = await findBuilding(buildingMigrateId);
  return findWorksheet(building.id);
}

async function findBuilding(buildingMigrateId) {
  const repo = new BuildingRepository();
  return repo.findByMigratedId(buildingMigrateId);
}

async function findWorksheet(buildingId) {
  const repo = new WorksheetRepository();
  const worksheet = await repo.findWorksheetByBuilding(buildingId);
  if (!worksheet) {
    throw new Error(`Could not find worksheet for building ${buildingId}`);
  }

  return worksheet;

  // return repo.findByIdWIthIncludes(worksheet.id);
}
