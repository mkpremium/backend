import {findOwnerByMigrate, getBuildingMigrateIdNotNull} from './migrate-building-states'
import {mapBusinessStates} from '../constants'
import {OwnerRepository} from '../../src/owner/models'
import {validateHeaders} from '../lib'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'

export async function migrateBusinessStates (inputFile) {
  await validateHeaders(inputFile, 'Id_Catastro;EstadoSeguimiento;Id_Propietario')
  await csvToJSON(inputFile, doOnEachRow)
}

async function doOnEachRow (data) {
  try {
    const buildingMigrateId = getBuildingMigrateIdNotNull(data)
    const owner = await findOwnerByMigrate(data)

    const status = mapBusinessStates(data['EstadoSeguimiento'])

    const repo = new OwnerRepository()
    await repo.updateBusinessStatusFirebase(owner.id, status, owner.business.meetingWithOperatorId)
    console.log('migrate business status', buildingMigrateId, owner.buildingId)
  } catch (e) {
    console.error(e.message)
  }
}
