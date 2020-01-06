import debug from 'debug'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'
import {cleanObjectKeys, removeNullValues} from '../../src/migration/models/models-helper'
import {BuildingRepository} from '../../src/building/models'
import {N1qlQuery} from 'couchbase'
import {findBuilding, getFieldNotNull, Input} from './migrate-portugal'
import {WorksheetRepository} from '../../src/worksheet/models/worksheet'

const debugMigrate = debug('app:migration:portugal')

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function migrate (inputFile) {
  debugMigrate('Process started...')
  const buildingWithErrors = []
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (personRecord) {
    const input = Input(removeNullValues(cleanObjectKeys(personRecord)))
    try {
      await processBuilding(input)
    } catch (error) {
      console.error(error, ' in record with catastro:', input.id_finca)
      buildingWithErrors.push({
        edificio: input.id_finca,
        error: error && error.toString()
      })
    }
  }

  debugMigrate('Building with errors:', JSON.stringify(buildingWithErrors, null, 2))
  debugMigrate('Process ended.')
}

/**
 *
 * @param input - csv row data
 * @returns {Promise<void>}
 */
async function processBuilding (input) {
  debugMigrate('\n[NEW ROW] Process Building record with catastro:', input.id_finca)
  const catastro = getFieldNotNull(input, 'id_finca')

  if (catastro) {
    const building = await findBuilding(catastro)
    if (building) {
      debugMigrate(`Building found`, catastro)
      await updateAddress(building, input)
      debugMigrate('\nProcess ended for building record with catastro / id_finca:', input.id_finca)
    } else {
      debugMigrate(`Building not found.`)
      throw new Error(`Building not found.`)
    }
  }
}

/**
 * Changes city and province name from PORTO to Porto
 * @param building
 * @param input
 * @returns {Promise<void>}
 */
async function updateAddress (building, input) {
  const buildingRepository = new BuildingRepository()
  const worksheetRepository = new WorksheetRepository()
  let bucket = buildingRepository.getBucketName()
  const specialCases = ['ALVARES CABRAL', 'ALCAIDE DE FARIA', 'ANTERO DE ARAUJO']
  let type
  let street
  const givenStreet = input.calle

  if (specialCases.indexOf(givenStreet) !== -1) {
    type = 'RUA'
    street = givenStreet
  } else {
    const streetComponents = givenStreet.split(' ')
    type = streetComponents.shift()
    street = streetComponents.join(' ')
  }

  const updateCity = N1qlQuery
    .fromString(`UPDATE ${bucket} SET address.type = ${JSON.stringify(type)}, address.street = ${JSON.stringify(street)} WHERE id = ${JSON.stringify(building.id)}`)

  await buildingRepository.queryRaw(updateCity)
  let worksheet = await worksheetRepository.findWorksheetByBuilding(building.id)

  if (worksheet) {
    bucket = worksheetRepository.getBucketName()
    const updateAddress = N1qlQuery
      .fromString(`UPDATE ${bucket} t SET buildingAddress.type = ${JSON.stringify(type)}, buildingAddress.street = ${JSON.stringify(street)} WHERE id = ${JSON.stringify(worksheet.id)}`)

    await buildingRepository.queryRaw(updateAddress)
  } else {
    throw new Error(`Worksheet not found.`)
  }
}
