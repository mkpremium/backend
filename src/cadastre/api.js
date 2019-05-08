import Promise from 'bluebird';
import _ from 'lodash';
import camaro from 'camaro';
import axiosCadastreClient from '../banks/lib/catastro/axios';
import {parseCoords} from './coord-parser';
import {keys, streetTypes, templates, urls} from './constants';
import {cadastrewaitTimeMS} from '../../config';
import {newHttpError} from '../lib/http-error';

export class CadastreApi {
  constructor(fakeData = {}) {
    /**
     * @private
     */
    this.fakeData = fakeData;
    /**
     * @private
     */
    this.client = axiosCadastreClient();
  }

  async fetchProvinces() {
    return this.fetchXmlItems(keys.PROVINCES);
  }

  async fetchCities(province) {
    return this.fetchXmlItems(keys.CITIES, {
      Provincia: province,
      Municipio: ''
    });
  }

  async fetchStreets(province, city) {
    const items = await this
      .fetchXmlItems(keys.STREET, {
        Provincia: province,
        Municipio: city,
        TipoVia: '',
        NombreVia: ''
      });

    return items.map(street => Object.assign({}, street, {typeName: streetTypes[street.type]} || []));
  }

  async fetchCadastreByAddress(address) {
    const params = {
      Provincia: address.province,
      Municipio: address.city,
      TipoVia: address.street.type,
      NomVia: address.street.name,
      Numero: address.number
    };
    const xml = await this.fetchXml(keys.BY_ADDRESS, params);
    const result = camaro(xml, templates[keys.BY_ADDRESS]);

    return [
      _.get(result, 'first', ''),
      _.get(result, 'second', ''),
      _.get(result, 'third', '')
    ].join('');
  }

  async fetchLocationByCadastre(cadastreReference) {
    const params = {
      Provincia: '',
      Municipio: '',
      SRS: '',
      RC: cadastreReference
    };

    const xml = await this.fetchXml(keys.BY_CADASTRE, params);
    const result = camaro(xml, templates[keys.BY_CADASTRE]);

    if (result.error) {
      throw newHttpError(500, 'Catastro api: ' + result.error);
    }

    return parseCoords(result);
  }

  /**
   * @private
   */
  static parseXmlItems(xml, templateKey) {
    const {items, error} = camaro(xml, templates[templateKey]);

    if (error) {
      throw newHttpError(500, 'Catastro api: ' + error);
    }

    return items;
  }

  /**
   * @private
   */
  async fetchXmlItems(key, params) {
    const xml = await this.fetchXml(key, params);

    return CadastreApi.parseXmlItems(xml, key);
  }

  /**
   * @private
   */
  async fetchXml(key, params) {
    let xml;

    if (this.fakeData[key]) {
      xml = this.fakeData[key];
    } else {
      try {
        await Promise.delay(cadastrewaitTimeMS);
        const response = await this.client.get(urls[key], {params});
        xml = response.data;
      } catch (e) {
        console.error(e);
        throw new Error('Cannot fetch provinces: ' + e.response.data);
      }
    }

    return xml;
  }
}
