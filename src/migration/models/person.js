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

export default function migrateFromCsv(data) {
  const input = PersonInputDTO(removeNullValues(cleanObjectKeys(data)));

  const isEmpty = val => typeof val === 'undefined' || val == null || val === '';

  const birthDate = () => {
    if (isEmpty(input.ano_naci) || isEmpty(input.mes_naci) || isEmpty(input.dia_naci)) {
      return null;
    }
    return new Date(`${input.ano_naci}-${input.mes_naci}-${input.dia_naci}`);
  };
  const address = () => ({
    fullAddress: input.nuc,
    postalCode: input.cod_post ? input.cod_post.padStart(5, '0') : null
  });

  const gender = () => {
    const value = input.sexo || '';
    switch (value.toUpperCase()) {
      case 'H':
        return 'MASCULINO';
      case 'M':
        return 'FEMENINO';
      default:
        return 'NINGUNO';
    }
  };

  const contacts = () => {
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
  };

  return t.Person({
    id: uuid(),
    name: `${_get(input, 'nombre', '')} ${_get(input, 'apellido_1', '')} ${_get(input, 'apellido_2', '')}`.trim(),
    firstName: _get(input, 'nombre', ''),
    firstSurname: _get(input, 'apellido_1', ''),
    secondSurname: _get(input, 'apellido_2', ''),
    birthDate: birthDate(),
    addresses: [address()],
    contacts: contacts(),
    gender: gender(),
    personType: 'NATURAL',
    _migrateId: input.id
  });
}
