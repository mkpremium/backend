import {findWorksheetByMigrateId, getBuildingMigrateIdNotNull, getOwnerBuilding} from './migrate-building-states';
import {mapBusinessStates} from '../constants';
import {OwnerRepository} from '../../src/owner/models';
import {validateHeaders} from '../lib';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';

export async function migrateBusinessStates(inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;EstadoSeguimiento');
  await csvToJSON(inputFile, doOnEachRow);
}

async function doOnEachRow(data) {
  try {
    const buildingMigrateId = getBuildingMigrateIdNotNull(data);
    const worksheet = await findWorksheetByMigrateId(buildingMigrateId);
    const {owner, building} = getOwnerBuilding(worksheet);

    const status = mapBusinessStates(data['EstadoSeguimiento']);

    const business = {
      status,
      meetingWithOperatorId: 'b4bc93a1-3b48-4f50-9af9-5b135285918a'
    };

    const repo = new OwnerRepository();
    await repo.updateBusinessStatusFirebase(owner.id, status, business.meetingWithOperatorId);
    console.log('migrate business status', buildingMigrateId, building.id);
  } catch (e) {
    console.error(e.message);
  }
}
