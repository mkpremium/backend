import {BuildingRepository} from '../../src/building/models';
import {validateHeaders} from '../lib';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {WorkSheetStatus} from '../../src/types/worksheet';
import {removeNullValue} from '../../src/migration/models/models-helper';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import {saveBuildingToFirebase_} from '../../src/firebase/lib/business';
import _ from 'lodash';
import {isPrimary} from '../../src/types/owner';
import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {onlyForBusiness} from '../constants';

export async function noSale(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;NoVende');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    await updateWorksheetStatus(WorkSheetStatus.NO_SALE, data);
  }
}

async function updateWorksheetStatus(newStatus, data) {
  const buildingMigrateId = getBuildingMigrateIdNotNull(data);
  const worksheet = await findWorksheetByMigrateId(buildingMigrateId);
  const w = fromJSON(worksheet, t.WorkSheet);
  const updatedWorksheet = w.setStatus(newStatus);
  await saveDataChange(updatedWorksheet);

  async function sendToFirebase(worksheet) {
    const {owner, building} = getOwnerBuilding(worksheet);
    await saveBuildingToFirebase_(building, owner);
  }

  return sendToFirebase(updatedWorksheet);
}

export function getOwnerBuilding(worksheet) {
  const [building] = worksheet.relatedBuildings;
  const primaryOwner = _.chain(worksheet.relatedOwners).filter(isPrimary).head().value();
  const alternativeOwner = _.chain(worksheet.relatedOwners).head().value();
  const owner = JSON.parse(JSON.stringify(primaryOwner || alternativeOwner));
  const businessStatus = onlyForBusiness(worksheet.status);
  owner.building = building;
  if (businessStatus) {
    owner.business = {
      meetingWithOperatorId: 'b4bc93a1-3b48-4f50-9af9-5b135285918a',
      status: businessStatus
    };
  }
  return {owner, building};
}

async function saveDataChange(worksheet) {
  const repo = new WorksheetRepository();
  return repo.save(worksheet, false);
}

export function getBuildingMigrateIdNotNull(data) {
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

export async function findWorksheetByMigrateId(buildingMigrateId) {
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

  return repo.findByIdWIthIncludes(worksheet.id);
}
