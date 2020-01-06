import debug from 'debug'
import t from 'tcomb'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'
import {cleanObjectKeys, removeNullValues} from '../../src/migration/models/models-helper'
import {WorksheetRepository} from '../../src/worksheet/models/worksheet'
import {WorkSheetStatus} from '../../src/types/worksheet'
import {N1qlQuery} from 'couchbase'
import {BuildingRepository} from '../../src/building/models'
import {getFieldNotNull} from './migrate-persons'
import {OwnerStatus} from '../../src/types/enums'

const debugMigrate = debug('app:migration:worksheet-states')

export const Input = t.struct({
  id_catastro: t.maybe(t.Str) // building._migrateId
})

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function startProcess (inputFile) {
  debugMigrate('Process started...', inputFile)
  const recordsOK = []
  const recordsWithErrors = []
  const modifiedWorksheetsIds = []
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (record) {
    const input = Input(removeNullValues(cleanObjectKeys(record)))

    try {
      const result = await processBuilding(input)
      recordsOK.push(result)
      modifiedWorksheetsIds.push(result.worksheet.id)
    } catch (error) {
      console.error(error, ' in record with id_catastro:', input.id_catastro)
      recordsWithErrors.push({
        input: input,
        error: error && error.toString()
      })
    }
  }

  debugMigrate('Records with errors:', JSON.stringify(recordsWithErrors, null, 2))
  debugMigrate('Records OK:', JSON.stringify(recordsOK, null, 2))
  debugMigrate('Modified worksheet ids:', modifiedWorksheetsIds)
  debugMigrate('Count records OK:', recordsOK.length)
  debugMigrate('Count records with error:', recordsWithErrors.length)
  debugMigrate('Process ended.')
}

/**
 *
 * @param input - csv row data
 * @returns {Promise<void>}
 */
async function processBuilding (input) {
  debugMigrate('\n[NEW ROW] Process building record with id_catastro:', input.id_catastro)
  const buildingRepository = new BuildingRepository()
  const worksheetRepository = new WorksheetRepository()
  const migrateId = getFieldNotNull(input, 'id_catastro')
  const [building] = await buildingRepository.findByMigratedId(migrateId)
  let worksheet = await worksheetRepository.findWorksheetByBuilding(building.id)

  if (worksheet) {
    if (worksheet.status === WorkSheetStatus.NO_SALE) {
      // look for owners related
      worksheet = await worksheetRepository.findByIdWIthIncludes(worksheet.id, ['relatedOwners'])
      const worksheetIsValid = isWorksheetValid(worksheet.relatedOwners)
      const worksheetHasAtLeastOneOwnerVerified = hasAtLeastOneOwnerVerified(worksheet.relatedOwners)
      let updatedWorksheet

      if (worksheetIsValid && worksheetHasAtLeastOneOwnerVerified) {
        updatedWorksheet = await updateWorksheetStatus(worksheet, WorkSheetStatus.WITH_OWNER)
      } else if (worksheetIsValid) {
        updatedWorksheet = await updateWorksheetStatus(worksheet, WorkSheetStatus.DEFAULT)
      } else {
        updatedWorksheet = await updateWorksheetStatus(worksheet, WorkSheetStatus.INVALID)
      }

      return {
        worksheet: updatedWorksheet,
        owners: worksheet.relatedOwners
      }
    } else {
      throw new Error(`Worksheet id ${worksheet.id} has no status NO_SALE, current status: ${worksheet.status}.`)
    }
  } else {
    throw new Error(`Worksheet not found.`)
  }
}

/**
 * Loops worksheet related owners, returns true is at least one has status
 * VERIFICADO, otherwise false.
 * @param worksheetOwnerObjects
 * @returns {boolean}
 */
export function hasAtLeastOneOwnerVerified (worksheetOwnerObjects) {
  return worksheetOwnerObjects.some((owner) => {
    return owner.status === OwnerStatus.VERIFIED
  })
}

/**
 * Loops worksheets related owners and person related, return true if
 * at least one owner has one contact, false otherwise.
 * @param worksheetOwnerWithPersonObjects
 * @returns {boolean}
 */
export function isWorksheetValid (worksheetOwnerWithPersonObjects) {
  return worksheetOwnerWithPersonObjects.some((owner) => {
    const person = owner.person
    const contacts = person && person.contacts

    return contacts && contacts.length > 0
  })
}

/**
 * Updates worksheet status using N1qlQuery
 * @param worksheet
 * @param status
 * @returns {Promise<*|null>}
 */
export async function updateWorksheetStatus (worksheet, status) {
  const worksheetRepository = new WorksheetRepository()
  const bucket = worksheetRepository.getBucketName()
  const updateStatus = N1qlQuery
    .fromString(`UPDATE ${bucket} t SET status = ${JSON.stringify(status)} WHERE id = ${JSON.stringify(worksheet.id)}`)

  await worksheetRepository.queryRaw(updateStatus)
  return worksheetRepository.findById(worksheet.id)
}
