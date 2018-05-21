import debug from 'debug';
import Promise from 'bluebird';
import axiosCreate from './axios';
import xmldoc from 'xmldoc';
import Utm from 'utm-latlng';

import {cadastreLocation} from '../../../../config';
import {getRandomProxy} from './proxies';

const SRS = {
  'EPSG:32627': 'WGS 84',
  'EPSG:32628': 'WGS 84',
  'EPSG:32629': 'WGS 84',
  'EPSG:32630': 'WGS 84',
  'EPSG:32631': 'WGS 84',
  'EPSG:25829': 'ETRS89',
  'EPSG:25830': 'ETRS89',
  'EPSG:25831': 'ETRS89',
  'EPSG:23029': 'ED50',
  'EPSG:23030': 'ED50',
  'EPSG:23031': 'ED50'
};
const ZONE_NUM = {
  'EPSG:32627': 27,
  'EPSG:32628': 28,
  'EPSG:32629': 29,
  'EPSG:32630': 30,
  'EPSG:32631': 31,
  'EPSG:25829': 29,
  'EPSG:25830': 30,
  'EPSG:25831': 31,
  'EPSG:23029': 29,
  'EPSG:23030': 30,
  'EPSG:23031': 31
};

const debugCadastre = debug('app:banks:cadastre');

async function xmlParser() {
  return async(rawXml) => {
    const document = new xmldoc.XmlDocument(rawXml);
    const coord = {
      srs: document.valueWithPath('coordenadas.coord.geo.srs'),
      xcen: parseFloat(document.valueWithPath('coordenadas.coord.geo.xcen')),
      ycen: parseFloat(document.valueWithPath('coordenadas.coord.geo.ycen'))
    };
    debugCadastre('xmlParser', 'parsing coord', coord);
    const utm = new Utm(SRS[coord.srs]);
    const {lat, lng} = utm.convertUtmToLatLng(coord.xcen, coord.ycen, ZONE_NUM[coord.srs], 'N');
    return {
      latitude: lat,
      longitude: lng
    };
  };
}

export async function cadastreLocationService(cadastreReference) {
  const cadastreReference14 = cadastreReference.substr(0, 14);
  debugCadastre('cadastreLocationService', 'init', cadastreLocation, cadastreLocation);
  await Promise.delay(cadastreLocation.waitTimeMS);
  const parser = await xmlParser();
  const proxy = await getRandomProxy();
  debugCadastre('cadastreLocationService', 'fetching', proxy);
  const axios = axiosCreate({proxy});
  const response = await axios.get(cadastreLocation.serviceUrl, {
    params: {
      RC: cadastreReference14,
      Provincia: '',
      Municipio: '',
      SRS: ''
    }
  });
  debugCadastre('cadastreLocationService', 'parsing', response.data);
  return parser(response.data);
}

if (require.main === module) {
  const sampleCadastreReference = '9914502TF7091S0021GT';
  cadastreLocationService(sampleCadastreReference)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
