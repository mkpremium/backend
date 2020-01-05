import crypto from 'crypto'
import { CouchbaseModel } from '../db/model'
import { CadastreAddressInput, CadastreCache } from './types'
import { ONE_MONTH } from '../lib/constants'
import { CadastreApi } from './api'

function cacheHash (value) {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex')
}

export class CadastreRepository extends CouchbaseModel {
  constructor (fakeData = {}) {
    super()
    this.Struct = CadastreCache
    /**
     * @private
     * @type {CadastreApi}
     */
    this.api = new CadastreApi(fakeData)
  }

  async getProvinces () {
    const cacheKey = 'provinces'
    const cached = await this.findById(cacheKey)
    if (cached) {
      return cached.value
    }

    const provinces = await this.api.fetchProvinces()
    if (provinces.length > 0) {
      await this.saveToExpire(cacheKey, provinces)
    }

    return provinces
  }

  async getCitiesByProvince (province) {
    const cacheKey = `cities:${cacheHash(province)}`
    const cached = await this.findById(cacheKey)
    if (cached) {
      return cached.value
    }

    const cities = await this.api.fetchCities(province)
    if (cities.length > 0) {
      await this.saveToExpire(cacheKey, cities)
    }

    return cities
  }

  async getStreetNamesByCity (province, city) {
    const cacheKey = `streets:${cacheHash({ province, city })}`
    const cached = await this.findById(cacheKey)
    if (cached) {
      return cached.value
    }

    const streets = await this.api.fetchStreets(province, city)
    if (streets.length > 0) {
      await this.saveToExpire(cacheKey, streets)
    }

    return streets
  }

  /**
   *
   * @param {CadastreAddressInput} address
   * @return {Promise<*>}
   */
  async getBuildingByAddress (address) {
    CadastreAddressInput(address)
    const cacheKey = `complete:${cacheHash(address)}`
    const cached = await this.findById(cacheKey)
    if (cached) {
      return cached.value
    }

    const building = await this.api.fetchBuildingByAddress(address)
    building.location = await this.api.fetchLocationByCadastre(building.cadastre.reference)

    await this.saveToExpire(cacheKey, building)

    return building
  }

  async getBuildingByCadastre (cadastreReference) {
    const cacheKey = `complete:${cadastreReference}`
    const cached = await this.findById(cacheKey)
    if (cached) {
      return cached.value
    }
    const building = await this.api.fetchBuildingByCadastre(cadastreReference)
    building.location = await this.api.fetchLocationByCadastre(cadastreReference)

    await this.saveToExpire(cacheKey, building)

    return building
  }

  /**
   *
   * @param id Unique Key for retrieve the cached data
   * @param data
   * @return {Promise<*>}
   */
  async saveToExpire (id, data) {
    const options = {
      expiry: ONE_MONTH
    }
    return this.save({ id, value: data }, false, options)
  }
}

export async function getBuildingByCadastre (cadastreReference) {
  const repo = new CadastreRepository()
  return repo.getBuildingByCadastre(cadastreReference)
}
