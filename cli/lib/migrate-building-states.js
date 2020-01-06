import debug from 'debug'
import {BuildingRepository} from '../../src/building/models'
import {validateHeaders} from '../lib'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'
import {WorkSheetStatus} from '../../src/types/worksheet'
import {removeNullValue} from '../../src/migration/models/models-helper'
import {WorksheetRepository} from '../../src/worksheet/models/worksheet'
import _ from 'lodash'
import {isPrimary} from '../../src/types/owner'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import {onlyForBusiness} from '../constants'
import {OwnerBusinessStatus} from '../../src/types/enums'
import {OwnerRepository} from '../../src/owner/models'

const debugMigrate = debug('app:migration:building-states')

export async function noSale (inputFile) {
  debugMigrate('[noSale] Process started for file NoVende.csv ...')
  await validateHeaders(inputFile, 'Id_Catastro;NoVende')
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (data) {
    try {
      debugMigrate('\n[noSale] Process started for record: \n', data)
      await updateWorksheetStatus(WorkSheetStatus.NO_SALE, data)
    } catch (error) {
      debugMigrate('[noSale.Error]', error, ' in record: \n', data)
    }
  }

  debugMigrate('[noSale] Process ended for file NoVende.csv')
}

async function updateWorksheetStatus (newStatus, data, mapBusiness) {
  const buildingMigrateId = getBuildingMigrateIdNotNull(data)
  const worksheet = await findWorksheetByMigrateId(buildingMigrateId)
  const w = fromJSON(worksheet, t.WorkSheet)
  const updatedWorksheet = w.setStatus(newStatus)
  await saveDataChange(updatedWorksheet)

  return updateWorksheetStatusWithMeeting(newStatus, data, mapBusiness, updatedWorksheet)
}

async function updateWorksheetStatusWithMeeting (newStatus, data, mapBusiness, worksheet) {
  if (WorkSheetStatus.MEETING !== newStatus) {
    return
  }

  const meetingWithOperatorId = mapBusiness[data['Id_Comercial']]

  if (!meetingWithOperatorId) {
    throw new Error(`Id_Comercial '${data['Id_Comercial']}' is not present on the map-business.json`)
  }

  const owner = await findOwnerByMigrate(data)
  const status = OwnerBusinessStatus.PENDING
  const business = {
    status,
    meetingWithOperatorId
  }
  const repo = new OwnerRepository()

  if (!owner.buildingId) {
    debugMigrate('Owner with id:', owner.id, 'has building id null, proceed to set the building of worksheet...')

    // update owner building with worksheet building
    const updatedOwner = t.update(owner, {buildingId: {$set: worksheet.relatedBuildingIds[0]}})
    await repo.save(updatedOwner, false)

    // add owner to worksheet
    const worksheetRepository = new WorksheetRepository()
    await worksheetRepository.addOwner(worksheet, owner)
  }

  await repo.updateBusinessStatusFirebase(owner.id, status, business.meetingWithOperatorId)
}

export async function findOwnerByMigrate (data) {
  const repo = new OwnerRepository()
  const migratedId = data['Id_Propietario']

  return repo.findByMigratedId(migratedId)
}

export function getOwnerBuilding (worksheet, businessId) {
  const [building] = worksheet.relatedBuildings
  const primaryOwner = _.chain(worksheet.relatedOwners).filter(isPrimary).head().value()
  const alternativeOwner = _.chain(worksheet.relatedOwners).head().value()
  const owner = JSON.parse(JSON.stringify(primaryOwner || alternativeOwner))
  const businessStatus = onlyForBusiness(worksheet.status)
  owner.building = building
  if (businessStatus && businessId) {
    owner.business = {
      meetingWithOperatorId: businessId,
      status: businessStatus
    }
  }
  return {owner, building}
}

async function saveDataChange (worksheet) {
  const repo = new WorksheetRepository()
  return repo.save(worksheet, false)
}

export function getBuildingMigrateIdNotNull (data) {
  const buildingMigrateId = removeNullValue(data['Id_Catastro'])
  if (buildingMigrateId === null) {
    throw new Error(`invalid ID_CATASTRO '${data['Id_Catastro']}'`)
  }
  return buildingMigrateId
}

export async function withMeeting (inputFile, mapBusiness) {
  debugMigrate('[withMeeting] Process started for file Visitas.csv...')
  await validateHeaders(inputFile, '"Id_Catastro";"Visita";"Id_Comercial";"Fecha";"Id_Propietario"')
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (data) {
    try {
      debugMigrate('\n[withMeeting] Process started for record \n', data)
      await updateWorksheetStatus(WorkSheetStatus.MEETING, data, mapBusiness)
    } catch (error) {
      debugMigrate('[withMeeting Error]', error, ' in record: \n', data)
    }
  }

  debugMigrate('[withMeeting] Process ended for file Visitas.csv')
}

export async function alreadySold (inputFile) {
  debugMigrate('[alreadySold] Process started for file YaVendido.csv...')
  await validateHeaders(inputFile, 'Id_Catastro;Venduto')
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (data) {
    try {
      debugMigrate('\n[alreadySold] Process started for record \n', data)
      await updateWorksheetStatus(WorkSheetStatus.ALREADY_SOLD, data)
    } catch (error) {
      debugMigrate('[alreadySold Error]', error, ' in record: \n', data)
    }
  }
  debugMigrate('[alreadySold] Process ended for file YaVendido.csv')
}

export async function findWorksheetByMigrateId (buildingMigrateId) {
  const [building] = await findBuilding(buildingMigrateId)
  return findWorksheet(building.id)
}

async function findBuilding (buildingMigrateId) {
  const repo = new BuildingRepository()
  return repo.findByMigratedId(buildingMigrateId)
}

async function findWorksheet (buildingId) {
  const repo = new WorksheetRepository()
  const worksheet = await repo.findWorksheetByBuilding(buildingId)
  if (!worksheet) {
    throw new Error(`Could not find worksheet for building ${buildingId}`)
  }

  return repo.findByIdWIthIncludes(worksheet.id)
}
