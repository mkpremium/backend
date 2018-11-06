import uuid from 'uuid/v4';
import t from 'tcomb';
import {cleanObjectKeys, removeNullValues} from './models-helper';
import {isEmpty, merge, omit, difference} from 'lodash';

export const OwnerInputDTO = t.struct({
  id_fornitore: t.Str,
  ragionesociale: t.maybe(t.Str),
  telefono: t.maybe(t.Str),
  fax: t.maybe(t.Str),
  cellulare: t.maybe(t.Str),
  email: t.maybe(t.Str),
  internet: t.maybe(t.Str),
  indirizzo: t.maybe(t.Str),
  cap: t.maybe(t.Str),
  id_localita: t.maybe(t.Str),
  id_comune: t.maybe(t.Str),
  id_prov: t.maybe(t.Str),
  id_nazione: t.maybe(t.Str),
  codfis: t.maybe(t.Str),
  pariva: t.maybe(t.Str),
  id_banca: t.maybe(t.Str),
  id_agenziabanca: t.maybe(t.Str),
  ccb: t.maybe(t.Str),
  intestatarioccb: t.maybe(t.Str),
  note: t.maybe(t.Str),
  tmstmp: t.maybe(t.Str),
  id_padre: t.maybe(t.Str),
  id_catastro: t.maybe(t.Str),
  importante: t.maybe(t.Str),
  altro_numero: t.maybe(t.Str),
  proprietari: t.maybe(t.Str),
  street: t.maybe(t.Str),
  number: t.maybe(t.Str),
  num_pb: t.maybe(t.Str),
  num_ib: t.maybe(t.Str),
  num_bd: t.maybe(t.Str),
  num_abc: t.maybe(t.Str),
  num_1: t.maybe(t.Str),
  num_2: t.maybe(t.Str),
  num_3: t.maybe(t.Str),
  verificato: t.maybe(t.Str),
  id_errore: t.maybe(t.Str),
  venduto: t.maybe(t.Str),
  telefonoerrato: t.maybe(t.Str),
  nonrisponde: t.maybe(t.Str),
  entepubblico: t.maybe(t.Str),
  proprietario2: t.maybe(t.Str),
  famiglia: t.maybe(t.Str),
  fratelli: t.maybe(t.Str),
  figli: t.maybe(t.Str),
  filter: t.maybe(t.Str)
});

export default function migrateFromCsv(data) {
  const input = OwnerInputDTO(removeNullValues(cleanObjectKeys(data)));

  const personType = () => {
    return (input.num_1 === null && input.num_2 === null)
      ? 'JURIDICA'
      : 'NATURAL';
  };

  const contacts = () => {
    const contacts = [];

    if (input.telefono) {
      contacts.push({
        type: 'TELEFONO',
        value: input.telefono
      });
    }

    if (input.email) {
      contacts.push({
        type: 'EMAIL',
        value: input.email
      });
    }

    if (input.fax && input.fax !== 'WEBAPP') {
      contacts.push({
        type: 'FAX',
        value: input.fax
      });
    }

    return contacts;
  };

  const ownerType = () => {
    if (isEmpty(input.codfis)) {
      return 'NINGUNO';
    }

    switch (input.codfis[0]) {
      case 'V':
        return 'VECINO';
      case 'P':
        return 'PRINCIPAL';
      case 'S':
        return 'SECUNDARIO';
    }
  };

  const name = input.ragionesociale || `NO Name ${input.id_fornitore}`;

  const person = t.Person({
    id: uuid(),
    name,
    firstName: input.num_3,
    firstSurname: input.num_1,
    secondSurname: input.num_2,
    documentNumber: input.pariva,
    personType: personType(),
    contacts: contacts(),
    _migrateOwnerId: input.id_fornitore
  });

  const owner = t.Owner({
    id: uuid(),
    type: ownerType(),
    note: input.note,
    personId: person.id,
    person: person,
    _relatedTo: input.proprietari,
    _migrateId: input.id_fornitore
  });

  return {owner, person};
}

export function combineDuplicatesDocumentNumber(data) {
  const combinedData = [];
  const owners = data.filter(({_documentType}) => _documentType === 'owner');
  const people = data.filter(({_documentType}) => _documentType === 'person');
  const peopleWithoutDocumentNumber = people.filter(({documentNumber}) => isEmpty(documentNumber));
  const peopleWithDocumentNumber = people.filter(({documentNumber}) => !isEmpty(documentNumber));

  let peopleToProcess = [].concat(peopleWithDocumentNumber);

  while (peopleToProcess.length > 0) {
    const [person] = peopleToProcess;
    let combined = Object.assign({}, person);

    const filterSameDocumentDifferentPerson = ({documentNumber, id}) => {
      return documentNumber === person.documentNumber && id !== person.id;
    };

    const duplicates = peopleWithDocumentNumber.filter(filterSameDocumentDifferentPerson);

    duplicates.forEach(duplicated => {
      merge(combined, omit(JSON.parse(JSON.stringify(duplicated)), ['id']));
      const ownerIdx = owners.findIndex(o => o.personId === duplicated.id);
      if (ownerIdx !== -1) {
        owners[ownerIdx] = t.update(owners[ownerIdx], {personId: {$set: combined.id}});
      }
    });

    combinedData.push(combined);
    peopleToProcess = difference(peopleToProcess, duplicates.concat([person]));
  }

  return combinedData
    .concat(peopleWithoutDocumentNumber)
    .concat(owners);
}
