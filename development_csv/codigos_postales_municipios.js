import path from 'path';
import {csvToJson} from '../src/migration/lib';

class CodigosPostalesMunicipios {
  constructor(data) {
    this.data = data;
  }

  findByPostalCode(postalCode) {
    return this.data.byPostalCode[postalCode];
  }

  findByCityId(cityId) {
    return this.data.byCityId[cityId];
  }

  getAll() {
    return this.data.all;
  }
}

export async function readCodigosPostalesMunicipios() {
  const dataHolder = {
    all: [],
    byCityId: {},
    byPostalCode: {}
  };
  const options = {
    delimiter: ','
  };
  const processFunc = row => {
    dataHolder.all.push(row);
    dataHolder.byCityId[row.municipio_id] = row;
    dataHolder.byPostalCode[row.codigo_postal] = row;
  };

  await csvToJson(path.join(__dirname, 'codigos_postales_municipios.csv'), processFunc, options);

  return new CodigosPostalesMunicipios(dataHolder);
}
