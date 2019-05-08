import * as tcomb from 'tcomb';
import {streetTypes} from './constants';

export const CadastreCache = tcomb.struct(
  {
    id: tcomb.String,
    value: tcomb.Any,
    _documentType: tcomb.enums.of(['cadastre-cache'])
  },
  {
    name: 'CadastreCache',
    defaultProps: {
      _documentType: 'cadastre-cache'
    }
  }
);

export const CadastreStreetType = tcomb.enums.of(Object.keys(streetTypes));
export const CadastreStreet = tcomb.struct(
  {
    type: CadastreStreetType,
    name: tcomb.String,
    number: tcomb.String
  },
  {
    name: 'CadastreStreet'
  }
);
export const CadastreAddressInput = tcomb.struct(
  {
    province: tcomb.String,
    city: tcomb.String,
    street: CadastreStreet
  },
  {
    name: 'NormalizedAddress'
  }
);
export const CitiesInput = tcomb.struct({
  province: tcomb.String
}, 'CitiesInput');

export const StreetsInput = tcomb.struct({
  province: tcomb.String,
  city: tcomb.String
}, 'StreetsInput');
