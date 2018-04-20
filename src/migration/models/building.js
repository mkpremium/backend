import uuid from 'uuid/v4';

import t from 'tcomb';
import {removeNullValues, cleanObjectKeys} from './models-helper';

export const BuildingInputDTO = t.struct({
  id: t.Str,
  type: t.maybe(t.Str),
  street: t.maybe(t.Str),
  number: t.maybe(t.Str),
  carrer: t.maybe(t.Str),
  numbero: t.maybe(t.Str),
  postcode: t.maybe(t.Str),
  build: t.maybe(t.Str),
  reference: t.maybe(t.Str),
  location: t.maybe(t.Str),
  postcode2: t.maybe(t.Str),
  classe: t.maybe(t.Str),
  surfacebuilded: t.maybe(t.Str),
  surfaceterrain: t.maybe(t.Str),
  coefficent: t.maybe(t.Str),
  use: t.maybe(t.Str),
  propertytype: t.maybe(t.Str),
  yearconstruction: t.maybe(t.Str),
  owner: t.maybe(t.Str),
  phone: t.maybe(t.Str),
  elementsnumber: t.maybe(t.Str),
  elementsaverage: t.maybe(t.Str),
  commonselements: t.maybe(t.Str),
  municipality: t.maybe(t.Str),
  province: t.maybe(t.Str),
  proprietari: t.maybe(t.Str),
  domicili: t.maybe(t.Str),
  poblacio: t.maybe(t.Str),
  numero_pb: t.maybe(t.Str),
  numero_ib: t.maybe(t.Str),
  numero_bd: t.maybe(t.Str),
  numero_abc: t.maybe(t.Str),
  numero_1: t.maybe(t.Str),
  numero_2: t.maybe(t.Str),
  numero_3: t.maybe(t.Str),
  surfaceroof: t.maybe(t.Str),
  filter: t.maybe(t.Str)
});

export default function migrateFromCsv(data) {
  const input = BuildingInputDTO(removeNullValues(cleanObjectKeys(data)));

  const postalCode = () => ({
    verified: !!input.postcode2,
    number: Number(input.postcode || input.postcode2)
  });
  const ownerPhones = () => {
    const phones = [];

    if (input.numero_pb) {
      phones.push({
        number: input.numero_pb,
        note: 'Número de paginas blancas'
      });
    }

    if (input.numero_bd) {
      phones.push({
        number: input.numero_bd,
        note: 'Número de Access'
      });
    }

    if (input.numero_abc) {
      phones.push({
        number: input.numero_abc,
        note: 'Número de ABC teléfonos'
      });
    }

    return phones;
  };
  const owner = () => ({
    name: input.proprietari,
    address: {
      fullAddress: input.domicili,
      city: input.poblacio || input.municipality
    },
    phones: ownerPhones()
  });

  const number = value => {
    if (value) {
      return Number(value.replace(',', '.'));
    }

    return 0;
  };

  const neighborhood = value => {
    if (/#/.test(value)) {
      return value.split('#')[0].trim();
    } else {
      return null;
    }
  };

  return t.Building({
    id: uuid(),
    _migrateId: input.id,
    address: {
      type: input.type,
      street: input.street,
      number: number(input.number),
      fullAddress: input.carrer,
      registerNumber: number(input.numbero),
      postalCode: postalCode(),
      city: input.municipality,
      province: input.province,
      zone: input.numero_3,
      neighborhood: neighborhood(input.numero_3)
    },
    buildingType: input.build,
    cadastre: {
      reference: input.reference,
      address: input.location
    },
    floorArea: number(input.surfacebuilded),
    landArea: number(input.surfaceterrain),
    roofArea: number(input.surfaceroof),
    coefficient: number(input.coefficent),
    use: input.use,
    propertyType: input.propertytype,
    buildingDate: number(input.yearconstruction),
    location: {
      lat: number(input.owner),
      lng: number(input.phone)
    },
    elements: {
      number: number(input.elementsnumber),
      average: number(input.elementsaverage),
      commons: number(input.commonselements)
    },
    owner: owner(),
    state: input.numero_ib
  });
}
