import crypto from 'crypto';
import {CouchbaseModel} from '../db/model';
import {CadastreAddressInput, CadastreCache} from './types';
import {ONE_MONTH} from '../lib/constants';
import {CadastreApi} from './api';

function cacheHash(value) {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');
}

export class CadastreRepository extends CouchbaseModel {
  constructor(fakeData = {}) {
    super();
    this.Struct = CadastreCache;
    /**
     * @private
     * @type {CadastreApi}
     */
    this.api = new CadastreApi(fakeData);
  }

  async getProvinces() {
    const cacheKey = 'provinces';
    const cached = await this.findById(cacheKey);
    if (cached) {
      return cached.value;
    }

    const provinces = await this.api.fetchProvinces();
    await this.saveToExpire(cacheKey, provinces);

    return provinces;
  }

  async getCitiesByProvince(province) {
    const cacheKey = `cities:${cacheHash(province)}`;
    const cached = await this.findById(cacheKey);
    if (cached) {
      return cached.value;
    }

    const cities = await this.api.fetchCities(province);
    await this.saveToExpire(cities);

    return cities;
  }

  async getStreetNamesByCity(province, city) {
    const cacheKey = `streets:${cacheHash({province, city})}`;
    const cached = await this.findById(cacheKey);
    if (cached) {
      return cached.value;
    }

    const streets = await this.api.fetchStreets(province, city);
    await this.saveToExpire(cacheKey, streets);

    return streets;
  }

  /**
   *
   * @param {CadastreAddressInput} address
   * @return {Promise<*>}
   */
  async getCompleteInfo(address) {
    CadastreAddressInput(address);
    const cacheKey = `complete:${cacheHash(address)}`;
    const cached = await this.findById(cacheKey);
    if (cached) {
      return cached.value;
    }

    const cadastreReference = await this.api.fetchCadastreByAddress(address);
    const location = await this.api.fetchLocationByCadastre(cadastreReference);

    const fullAddress = `${address.street.type} ${address.street.name} ${address.number}, ${address.city}`;

    const completeInfo = {
      location,
      address: {
        fullAddress,
        type: address.street.type,
        street: address.street.name,
        number: address.number,
        city: address.city,
        province: address.province
      }
    };

    await this.saveToExpire(cacheKey, completeInfo);

    return completeInfo;
  }

  /**
   *
   * @param id Unique Key for retrieve the cached data
   * @param data
   * @return {Promise<*>}
   */
  async saveToExpire(id, data) {
    const options = {
      expiry: ONE_MONTH
    };
    return this.save({id, value: data}, false, options);
  }
}
