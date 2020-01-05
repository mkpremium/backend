import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import debug from 'debug'
import axiosCreate from './axios'

import { cadastreAddress } from '../../../../config'
import Promise from 'bluebird'
import xmldoc from 'xmldoc'
import { getRandomProxy } from './proxies'
import { ONE_MONTH } from '../../../lib/constants'
import { BankFileRepository } from '../../models'

const debugCadastre = debug('app:banks:cadastre')

function xmlParser (rawXml) {
  const document = new xmldoc.XmlDocument(rawXml)

  const dirProperty = /lors/.test(rawXml) ? 'lors' : 'lous'
  const baseProperty = /lrcdnp/.test(rawXml) ? 'lrcdnp.rcdnp' : 'bico.bi'

  const base = `soap:Body.Consulta_DNP.consulta_dnp.${baseProperty}`
  const m2Path = 'soap:Body.Consulta_DNP.consulta_dnp.bico.lcons.cons.dfcons.stl'
  const baseAddress = `${base}.dt.locs.${dirProperty}.lourb.dir`

  const addressNumber = document.valueWithPath(`${baseAddress}.pnp`)

  const address = {
    number: addressNumber ? Number(addressNumber) : null,
    type: document.valueWithPath(`${baseAddress}.tv`) || '',
    street: document.valueWithPath(`${baseAddress}.nv`)
  }

  return {
    address: Object.assign({}, address, {
      fullAddress: `${address.type} ${address.street} ${address.number}`,
      city: document.valueWithPath(`${base}.dt.nm`),
      province: document.valueWithPath(`${base}.dt.np`)
    }),
    use: document.valueWithPath(`${base}.debi.luso`),
    m2: parseFloat(document.valueWithPath(m2Path))
  }
}

function paramsEnvelope (rc) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Provincia xmlns="http://www.catastro.meh.es/"></Provincia>
    <Municipio xmlns="http://www.catastro.meh.es/"></Municipio>
    <RefCat xmlns="http://www.catastro.meh.es/">${rc}</RefCat>
  </soap:Body>
</soap:Envelope>`
}

async function cadastreAddressLive (cadastreReference) {
  debugCadastre('cadastreAddressLive', 'init', cadastreAddress, cadastreReference)
  await Promise.delay(cadastreAddress.waitTimeMS)
  const proxy = await getRandomProxy()
  const axios = axiosCreate({ proxy })
  debugCadastre('cadastreAddressLive', 'fetching', proxy)
  const params = paramsEnvelope(cadastreReference)
  const response = await axios.post(
    cadastreAddress.serviceUrl,
    params, {
      headers: {
        SOAPAction: 'http://tempuri.org/OVCServWeb/OVCCallejero/Consulta_DNPRC',
        'Content-Type': 'text/xml',
        'Content-Length': params.length
      }
    })
  debugCadastre('cadastreAddressLive', 'parsing', response.data)
  const data = xmlParser(response.data)
  console.log('cadastreAddressLive', 'xml', response.data)
  console.log('cadastreAddressLive', 'data', data)
  return fromJSON(data, t.CadastreResponse)
}

export async function cadastreAddressService (cadastreReference) {
  const cacheKey = `${cadastreAddress.cachePrefix}:${cadastreReference}`
  const repo = new BankFileRepository()
  const cache = repo.getCache({ expiry: ONE_MONTH })

  const cachedAddress = await cache.getValue(cacheKey)
  if (cachedAddress) {
    debugCadastre('cadastreAddressService', 'using cache', cacheKey)
    return fromJSON(cachedAddress, t.CadastreResponse)
  }
  const liveAddress = await cadastreAddressLive(cadastreReference)
  await cache.setValue(cacheKey, liveAddress)

  return liveAddress
}

if (require.main === module) {
  const sampleCadastreReference = '7506313DF2870F0003WG'
  cadastreAddressService(sampleCadastreReference)
    .then(result => {
      console.log(JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
