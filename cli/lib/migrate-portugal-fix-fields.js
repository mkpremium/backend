import debug from 'debug'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'
import {cleanObjectKeys, removeNullValues} from '../../src/migration/models/models-helper'
import {BuildingRepository} from '../../src/building/models'
import {N1qlQuery} from 'couchbase'
import _ from 'lodash'
import axios from 'axios/index'
import {findBuilding, getFieldNotNull, Input} from './migrate-portugal'

const debugMigrate = debug('app:migration:portugal')

const requester = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/geocode',
  params: {
    key: 'AIzaSyCUI2ZE7LZzG0V3ioe9gu8mJZKtFmQYPrY'
  }
})

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
      console.error(error, ' in record with id_finca:', input.id_finca)
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
  debugMigrate('\n[NEW ROW] Process Building record with id_finca:', input.id_finca)
  const catastro = getFieldNotNull(input, 'id_finca')

  if (catastro) {
    const building = await findBuilding(catastro)
    if (building) {
      debugMigrate(`Building found`, catastro)
      await reviewBuilding(building, input)
      debugMigrate('\nProcess ended for building record with catastro / id_finca:', input.id_finca)
    } else {
      debugMigrate(`Building not found.`)
      throw new Error(`Building not found.`)
    }
  }
}

/**
 * Sets the coordenates of a building
 * @param building
 * @param input
 * @returns {Promise<void>}
 */
async function reviewBuilding (building, input) {
  const buildingRepository = new BuildingRepository()
  let bucket = buildingRepository.getBucketName()
  const geodata = await getGeoData(input)

  const updateLocation = N1qlQuery
    .fromString(`UPDATE ${bucket} t SET location.lat = ${geodata.latitude || 0}, location.lng = ${geodata.longitude || 0} WHERE META().id = ${JSON.stringify(building.id)}`)
  await buildingRepository.queryRaw(updateLocation)
}

/**
 * Getting geo data from google api
 * @param input
 * @returns {Promise<*>}
 */
async function getGeoData (input) {
  const address = `${input.calle} ${input.no}`
  const url = 'json?address=' + address.replace(/ /g, '+')
  debugMigrate('getting geo data...', 'requester GET', url)
  try {
    let latitude = 0
    let longitude = 0
    const result = await requester.get(url)

    debugMigrate('geo data', 'requester OK', JSON.stringify(result.data, null, 2))

    if (result.data) {
      const data = _.first(result.data.results)
      const location = data && data.geometry && data.geometry.location
      latitude = location && location.lat
      longitude = location && location.lng
    }

    return {
      latitude: latitude,
      longitude: longitude
    }
  } catch (exception) {
    debugMigrate('geo data', 'requester error', exception)
    return null
  }
}
