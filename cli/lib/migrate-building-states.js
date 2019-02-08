import {BuildingRepository} from '../../src/building/models';
import {validateHeaders} from '../lib';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {WorkSheetStatus} from '../../src/types/worksheet';
import {removeNullValue} from '../../src/migration/models/models-helper';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import _ from 'lodash';
import {isPrimary} from '../../src/types/owner';
import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {onlyForBusiness} from '../constants';
import {OwnerBusinessStatus} from '../../src/types/enums';
import {OwnerRepository} from '../../src/owner/models';

export async function noSale(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;NoVende');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    await updateWorksheetStatus(WorkSheetStatus.NO_SALE, data);
  }
}

async function updateWorksheetStatus(newStatus, data, mapBusiness) {
  const buildingMigrateId = getBuildingMigrateIdNotNull(data);
  const worksheet = await findWorksheetByMigrateId(buildingMigrateId);
  const w = fromJSON(worksheet, t.WorkSheet);
  const updatedWorksheet = w.setStatus(newStatus);
  await saveDataChange(updatedWorksheet);

  return updateWorksheetStatusWithMeeting(newStatus, data, mapBusiness);
}

async function updateWorksheetStatusWithMeeting(newStatus, data, mapBusiness) {
  if (WorkSheetStatus.MEETING !== newStatus) {
    return;
  }

  const meetingWithOperatorId = mapBusiness[data['Id_Comercial']];

  if (!meetingWithOperatorId) {
    throw new Error(`Id_Comercial '${data['Id_Comercial']}' is not present on the map-business.json`);
  }

  const owner = await findOwnerByMigrate(data);
  const status = OwnerBusinessStatus.PENDING;
  const business = {
    status,
    meetingWithOperatorId
  };
  const repo = new OwnerRepository();
  await repo.updateBusinessStatusFirebase(owner.id, status, business.meetingWithOperatorId);
}

async function findOwnerByMigrate(data) {
  const repo = new OwnerRepository();
  const migratedId = data['Id_Propietario'];

  const owners = await repo.findByMigratedId(migratedId);
  if (owners.length === 0) {
    throw new Error(`Cannot find owner by ${migratedId}`);
  }

  return owners[0];
}

export function getOwnerBuilding(worksheet, businessId) {
  const [building] = worksheet.relatedBuildings;
  const primaryOwner = _.chain(worksheet.relatedOwners).filter(isPrimary).head().value();
  const alternativeOwner = _.chain(worksheet.relatedOwners).head().value();
  const owner = JSON.parse(JSON.stringify(primaryOwner || alternativeOwner));
  const businessStatus = onlyForBusiness(worksheet.status);
  owner.building = building;
  if (businessStatus && businessId) {
    owner.business = {
      meetingWithOperatorId: businessId,
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

export async function withMeeting(inputFile, mapBusiness) {
  await validateHeaders(inputFile, '"Id_Catastro";"Visita";"Id_Comercial";"Fecha";"Id_Propietario"');
  await csvToJSON(inputFile, doOnEachRow);

  async function doOnEachRow(data) {
    return updateWorksheetStatus(WorkSheetStatus.MEETING, data, mapBusiness);
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
