import Promise from 'bluebird'
import _ from 'lodash'
import { transform } from 'camaro'
import axiosCadastreClient from './axios'
import { parseCoords } from './coord-parser'
import { keys, streetTypes, templates, urls } from './constants'
import { cadastrewaitTimeMS } from '../../config'
import { newHttpError } from '../lib/http-error'
import { calculateElements } from '../building/models'
import { logger } from '../infrastructure/logger'

export class CadastreApi {
  constructor (fakeData = {}) {
    /**
     * @private
     */
    this.fakeData = fakeData
    /**
     * @private
     */
    this.client = axiosCadastreClient()
  }

  async fetchProvinces () {
    return this.fetchXmlItems(keys.PROVINCES)
  }

  async fetchCities (province) {
    return this.fetchXmlItems(keys.CITIES, {
      Provincia: province,
      Municipio: ''
    })
  }

  async fetchStreets (province, city) {
    const items = await this
      .fetchXmlItems(keys.STREETS, {
        Provincia: province,
        Municipio: city,
        TipoVia: '',
        NombreVia: ''
      })

    return items.map(street => Object.assign({}, street, { typeName: streetTypes[street.type] } || []))
  }

  async fetchBuildingByAddress (address) {
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
    }
    const xml = await this.fetchXml(keys.BUILDING_BY_ADDRESS, params)
    const fetchedData = transform(xml, templates[keys.BUILDING_BY_ADDRESS])

    return CadastreApi.parseBuilding(fetchedData)
  }

  async fetchBuildingByCadastre (cadastreReference) {
    const params = CadastreApi.paramsEnvelope(cadastreReference)
    const options = {
      headers: {
        SOAPAction: 'http://tempuri.org/OVCServWeb/OVCCallejero/Consulta_DNPRC',
        'Content-Type': 'text/xml',
        'Content-Length': params.length
      }
    }

    const xml = await this.fetchXml(keys.BUILDING_BY_CADASTRE, params, 'post', options)
    const fetchedData = transform(xml, templates[keys.BUILDING_BY_CADASTRE])

    return CadastreApi.parseBuilding(fetchedData)
  }

  async fetchLocationByCadastre (cadastreReference) {
    const params = {
      Provincia: '',
      Municipio: '',
      SRS: '',
      RC: cadastreReference.substr(0, 14) // cadastre fails if more than 14 is send over
    }

    const xml = await this.fetchXml(keys.LOCATION_BY_CADASTRE, params)
    const result = transform(xml, templates[keys.LOCATION_BY_CADASTRE])

    if (result.error) {
      throw newHttpError(500, 'Catastro api: ' + result.error)
    }

    return parseCoords(result)
  }

  /**
   * @private
   */
  static parseXmlItems (xml, templateKey) {
    const { items, error } = transform(xml, templates[templateKey])

    if (error) {
      throw newHttpError(500, 'Catastro api: ' + error)
    }

    return items
  }

  static parseBuilding ({ building, error }) {
    if (error) {
      throw newHttpError(500, 'Catastro api: ' + error)
    }

    building.address.fullAddress = [
      _.get(building, 'address.type', ''),
      _.get(building, 'address.street', ''),
      _.get(building, 'address.number', ''),
      _.get(building, 'address.city', '')
    ].join(' ').trim()
    building.cadastre.reference = [
      _.get(building, 'cadastre.rc.pc1', ''),
      _.get(building, 'cadastre.rc.pc2', ''),
      _.get(building, 'cadastre.rc.car', ''),
      _.get(building, 'cadastre.rc.cc1', ''),
      _.get(building, 'cadastre.rc.cc2', '')
    ].join('')

    delete building.cadastre.rc

    const commons = building.entities.find(({ type }) => type === 'ELEMENTOS COMUNES') || { surface: 0 }
    building.entities = building.entities.filter(({ type }) => type !== 'ELEMENTOS COMUNES')
    building.elements = calculateElements({ commons: Number(commons.surface) }, building.entities)

    return building
  }

  /**
   * @private
   */
  async fetchXmlItems (key, params) {
    const xml = await this.fetchXml(key, params)

    return CadastreApi.parseXmlItems(xml, key)
  }

  /**
   * @private
   */
  async fetchXml (key, params, method = 'get', options = {}) {
    let xml

    if (this.fakeData[key]) {
      xml = this.fakeData[key]
    } else {
      try {
        await Promise.delay(cadastrewaitTimeMS)
        logger.debug('CadastreApi#fetchXml', { params, url: urls[key] })
        switch (method) {
          case 'get': {
            const responseGet = await this.client.get(urls[key], { params })
            xml = responseGet.data
            break
          }
          case 'post': {
            const responsePost = await this.client.post(urls[key], params, options)
            xml = responsePost.data
            break
          }
        }
      } catch (e) {
        throw new Error('Cannot fetch cadastre data: ' + e.response.data)
      }
    }

    return xml
  }

  static paramsEnvelope (rc) {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Provincia xmlns="http://www.catastro.meh.es/"></Provincia>
    <Municipio xmlns="http://www.catastro.meh.es/"></Municipio>
    <RefCat xmlns="http://www.catastro.meh.es/">${rc}</RefCat>
  </soap:Body>
</soap:Envelope>`
  }
}
