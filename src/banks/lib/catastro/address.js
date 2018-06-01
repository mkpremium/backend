import debug from 'debug';
import axiosCreate from './axios';

import {cadastreAddress} from '../../../../config';
import Promise from 'bluebird';
import xmldoc from 'xmldoc';
import {getRandomProxy} from './proxies';
import {ONE_MONTH, ONE_YEAR} from '../../../lib/constants';
import {BankFileRepository} from '../../models';

const debugCadastre = debug('app:banks:cadastre');

function xmlParser(rawXml) {
  const document = new xmldoc.XmlDocument(rawXml);

  const base = 'soap:Body.Consulta_DNP.consulta_dnp.bico.bi';
  const baseAddress = `${base}.dt.locs.lous.lourb.dir`;

  const address = {
    number: Number(document.valueWithPath(`${baseAddress}.pnp`)),
    type: document.valueWithPath(`${baseAddress}.tv`),
    street: document.valueWithPath(`${baseAddress}.nv`)
  };

  return {
    address: Object.assign({}, address, {
      fullAddress: `${address.type} ${address.street} ${address.number}`,
      city: document.valueWithPath(`${base}.dt.nm`),
      province: document.valueWithPath(`${base}.dt.np`)
    }),
    use: document.valueWithPath(`${base}.debi.luso`),
    m2: parseFloat(document.valueWithPath(`${base}.debi.sfc`))
  };
}

function paramsEnvelope(rc) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Provincia xmlns="http://www.catastro.meh.es/"></Provincia>
    <Municipio xmlns="http://www.catastro.meh.es/"></Municipio>
    <RefCat xmlns="http://www.catastro.meh.es/">${rc}</RefCat>
  </soap:Body>
</soap:Envelope>`;
}

async function cadastreAddressLive(cadastreReference) {
  debugCadastre('cadastreAddressService', 'init', cadastreAddress, cadastreReference);
  await Promise.delay(cadastreAddress.waitTimeMS);
  const proxy = await getRandomProxy();
  const axios = axiosCreate({proxy});
  debugCadastre('cadastreAddressService', 'fetching', proxy);
  const params = paramsEnvelope(cadastreReference);
  const response = await axios.post(
    cadastreAddress.serviceUrl,
    params, {
      headers: {
        'SOAPAction': 'http://tempuri.org/OVCServWeb/OVCCallejero/Consulta_DNPRC',
        'Content-Type': 'text/xml',
        'Content-Length': params.length
      }
    });
  debugCadastre('cadastreAddressService', 'parsing', response.data);
  return xmlParser(response.data);
}

export async function cadastreAddressService(cadastreReference) {
  const cacheKey = `address:${cadastreReference}`;
  const repo = new BankFileRepository();
  const cache = repo.getCache({expiry: ONE_MONTH});

  const cachedAddress = await cache.getValue(cacheKey);
  if (cachedAddress) {
    return cachedAddress;
  }
  const liveAddress = await cadastreAddressLive(cadastreReference);
  await cache.setValue(cacheKey, liveAddress);

  return liveAddress;
}

if (require.main === module) {
  const sampleCadastreReference = '9914502TF7091S0021GT';
  cadastreAddressService(sampleCadastreReference)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
