import uuid from 'uuid/v4';
import _get from 'lodash/get';
import _uniq from 'lodash/uniq';
import t from 'tcomb';
import {removeNullValues, cleanObjectKeys} from './models-helper';

export const PersonInputDTO = t.struct({
  id: t.maybe(t.String),
  provincia: t.maybe(t.String),
  municipio: t.maybe(t.String),
  apellido_1: t.maybe(t.String),
  apellido_2: t.maybe(t.String),
  nombre: t.maybe(t.String),
  tipo_via: t.maybe(t.String),
  nombre_via: t.maybe(t.String),
  num_via: t.maybe(t.String),
  bloque: t.maybe(t.String),
  portal: t.maybe(t.String),
  escalera: t.maybe(t.String),
  piso: t.maybe(t.String),
  puerta: t.maybe(t.String),
  dia_naci: t.maybe(t.String),
  mes_naci: t.maybe(t.String),
  ano_naci: t.maybe(t.String),
  cod_post: t.maybe(t.String),
  nuc: t.maybe(t.String),
  proprietari: t.maybe(t.String),
  domicili: t.maybe(t.String),
  telefono_pb: t.maybe(t.String),
  telefono_ib: t.maybe(t.String),
  telefono_db: t.maybe(t.String),
  telefono_abc: t.maybe(t.String),
  domicili_pb: t.maybe(t.String),
  domicili_ib: t.maybe(t.String),
  domicili_db: t.maybe(t.String),
  domicili_abc: t.maybe(t.String),
  sexo: t.maybe(t.String)
}, 'BuildingInputDTO');

function isEmpty(val) {
  return typeof val === 'undefined' || val == null || val === '';
}

function birthDate(input) {
  if (isEmpty(input.ano_naci) || isEmpty(input.mes_naci) || isEmpty(input.dia_naci)) {
    return null;
  }
  return new Date(`${input.ano_naci}-${input.mes_naci}-${input.dia_naci}`);
}

function address(input, codes) {
  const postalCode = input.cod_post ? input.cod_post.padStart(5, '0') : null;
  const info = postalCode ? codes.findByPostalCode(postalCode) : null;
  const city = info ? info.nombre_entidad_singular : null;
  return ({
    fullAddress: input.domicili,
    floor: input.piso,
    number: input.puerta,
    postalCode,
    city
  });
}

function gender(input) {
  const value = input.sexo || '';
  switch (value.toUpperCase()) {
    case 'H':
      return 'MASCULINO';
    case 'M':
      return 'FEMENINO';
    default:
      return 'NINGUNO';
  }
}

function contacts(input) {
  const contacts = [];

  if (!isEmpty(input.telefono_pb)) {
    contacts.push(input.telefono_pb);
  }

  if (!isEmpty(input.telefono_ib)) {
    contacts.push(input.telefono_ib);
  }

  if (!isEmpty(input.telefono_abc)) {
    contacts.push(input.telefono_abc);
  }

  return _uniq(contacts).map(value => ({value}));
}

export default function migrateFromCsv(data = {}, codes) {
  const input = PersonInputDTO(removeNullValues(cleanObjectKeys(data)));
  const name = `${_get(input, 'apellido_1', '')} ${_get(input, 'apellido_2', '')} ${_get(input, 'nombre', '')}`
    .trim()
    .replace(/\s+/g, ' ');

  const addr = address(input, codes);

  return t.Person({
    id: uuid(),
    name,
    firstName: _get(input, 'nombre', ''),
    firstSurname: _get(input, 'apellido_1', ''),
    secondSurname: _get(input, 'apellido_2', ''),
    birthDate: birthDate(input),
    birthYear: !isEmpty(input.ano_naci) ? Number(input.ano_naci) : 0,
    addresses: [addr],
    _address: addr,
    contacts: contacts(input),
    gender: gender(input),
    personType: 'NATURAL',
    _migrateId: input.id,
    _relatedTo: input.proprietari
  });
}
