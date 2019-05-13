import Promise from 'bluebird';
import _ from 'lodash';
import camaro from 'camaro';
import debug from 'debug';
import axiosCadastreClient from '../banks/lib/catastro/axios';
import {parseCoords} from './coord-parser';
import {keys, streetTypes, templates, urls} from './constants';
import {cadastrewaitTimeMS} from '../../config';
import {newHttpError} from '../lib/http-error';
import {calculateElements} from '../building/models';

const debugApi = debug('app:cadastre:api');

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

  async fetchBuildingByAddress(address) {
    const params = {
      Provincia: address.province,
      Municipio: address.city,
      Sigla: address.street.type,
      Calle: address.street.name,
      Numero: address.number,
      Bloque: '',
      Escalera: '',
      Planta: '',
      Puerta: ''
    };
    const xml = await this.fetchXml(keys.BY_ADDRESS, params);
    const {building, error} = camaro(xml, templates[keys.BY_ADDRESS]);

    if (error) {
      throw newHttpError(500, 'Catastro api: ' + error);
    }

    building.address.fullAddress = [
      _.get(building, 'address.type', ''),
      _.get(building, 'address.street', ''),
      _.get(building, 'address.number', ''),
      _.get(building, 'address.city', '')
    ].join(' ').trim();
    building.cadastre.reference = [
      _.get(building, 'cadastre.rc.pc1', ''),
      _.get(building, 'cadastre.rc.pc2', ''),
      _.get(building, 'cadastre.rc.car', ''),
      _.get(building, 'cadastre.rc.cc1', ''),
      _.get(building, 'cadastre.rc.cc2', '')
    ].join('');

    delete building.cadastre.rc;

    const commons = building.entities.find(({type}) => type === 'ELEMENTOS COMUNES') || {surface: 0};
    building.entities = building.entities.filter(({type}) => type !== 'ELEMENTOS COMUNES');
    building.elements = calculateElements({commons: Number(commons.surface)}, building.entities);

    return building;
  }

  async fetchLocationByCadastre(cadastreReference) {
    const params = {
      Provincia: '',
      Municipio: '',
      SRS: '',
      RC: cadastreReference.substr(0, 14) // cadastre fails if more than 14 is send over
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
        debugApi('fetching', urls[key], {params});
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
