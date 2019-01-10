import {BuildingRepository} from '../../src/building/models';
import {validateHeaders} from '../lib';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {WorkSheetStatus} from '../../src/types/worksheet';
import {removeNullValue} from '../../src/migration/models/models-helper';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';

export async function noSale(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;NoVende');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.NO_SALE, data);
  }
}

async function updateWorksheetStatus(newStatus, data) {
  const buildingMigrateId = getBuildingMigrateIdNotNull(data);
  const worksheet = await findWorksheetByMigrateId(buildingMigrateId);
  const updatedWorksheet = worksheet.setStatus(newStatus);
  await saveDataChange(updatedWorksheet);
}

async function saveDataChange(worksheet) {
  const repo = new WorksheetRepository();
  return repo.save(worksheet, false);
}

function getBuildingMigrateIdNotNull(data) {
  const buildingMigrateId = removeNullValue(data['Id_Catastro']);
  if (buildingMigrateId === null) {
    throw new Error(`invalid ID_CATASTRO '${data['Id_Catastro']}'`);
  }
  return buildingMigrateId;
}

export async function withMeeting(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;Visitare');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.MEETING, data);
  }
}

export async function alreadySold(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;Venduto');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.ALREADY_SOLD, data);
  }
}

async function findWorksheetByMigrateId(buildingMigrateId) {
  const [building] = await findBuilding(buildingMigrateId);
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
