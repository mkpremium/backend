import uuid from 'uuid/v4'
import * as t from 'tcomb'
import { Owner } from '../../types/owner'
import { cleanObjectKeys, removeNullValues } from './models-helper'
import { difference, isEmpty, merge, omit } from 'lodash'

/* eslint camelcase: 0 */
export const OwnerInputDTO = t.struct({
  id_fornitore: t.String,
  ragionesociale: t.maybe(t.String),
  telefono: t.maybe(t.String),
  fax: t.maybe(t.String),
  cellulare: t.maybe(t.String),
  email: t.maybe(t.String),
  internet: t.maybe(t.String),
  indirizzo: t.maybe(t.String),
  cap: t.maybe(t.String),
  id_localita: t.maybe(t.String),
  id_comune: t.maybe(t.String),
  id_prov: t.maybe(t.String),
  id_nazione: t.maybe(t.String),
  codfis: t.maybe(t.String),
  pariva: t.maybe(t.String),
  id_banca: t.maybe(t.String),
  id_agenziabanca: t.maybe(t.String),
  ccb: t.maybe(t.String),
  intestatarioccb: t.maybe(t.String),
  note: t.maybe(t.String),
  tmstmp: t.maybe(t.String),
  id_padre: t.maybe(t.String),
  id_cataStringo: t.maybe(t.String),
  importante: t.maybe(t.String),
  altro_numero: t.maybe(t.String),
  proprietari: t.maybe(t.String),
  Stringeet: t.maybe(t.String),
  number: t.maybe(t.String),
  num_pb: t.maybe(t.String),
  num_ib: t.maybe(t.String),
  num_bd: t.maybe(t.String),
  num_abc: t.maybe(t.String),
  num_1: t.maybe(t.String),
  num_2: t.maybe(t.String),
  num_3: t.maybe(t.String),
  verificato: t.maybe(t.String),
  id_errore: t.maybe(t.String),
  venduto: t.maybe(t.String),
  telefonoerrato: t.maybe(t.String),
  nonrisponde: t.maybe(t.String),
  entepubblico: t.maybe(t.String),
  proprietario2: t.maybe(t.String),
  famiglia: t.maybe(t.String),
  fratelli: t.maybe(t.String),
  figli: t.maybe(t.String),
  filter: t.maybe(t.String),
  indirizzo_he: t.maybe(t.String),
  cap_he: t.maybe(t.String),
  id_localita_he: t.maybe(t.String),
  id_prov_he: t.maybe(t.String),
  telefono_he: t.maybe(t.String),
  cellulare_he: t.maybe(t.String),
  altro_numero_he: t.maybe(t.String)
})

export default function migrateFromCsv (data) {
  const input = OwnerInputDTO(removeNullValues(cleanObjectKeys(data)))

  const personType = () => {
    return (input.num_1 === null && input.num_2 === null)
      ? 'JURIDICA'
      : 'NATURAL'
  }

  const contacts = () => {
    const contacts = []
    const uniqueContacts = []

    if (input.telefono) {
      contacts.push({
        type: 'TELEFONO',
        value: input.telefono
      })
      uniqueContacts.push(input.telefono)
    }

    if (input.cellulare && uniqueContacts.indexOf(input.cellulare) === -1) {
      contacts.push({
        type: 'TELEFONO',
        value: input.cellulare.replace(/[^0-9]/, '')
      })
      uniqueContacts.push(input.cellulare)
    }

    if (input.num_pb) {
      const num_pb = input.num_pb.replace(/[^0-9]/, '')

      if (num_pb !== '' && uniqueContacts.indexOf(num_pb) === -1) {
        contacts.push({
          type: 'TELEFONO',
          value: num_pb
        })
        uniqueContacts.push(num_pb)
      }
    }

    if (input.num_ib) {
      const num_ib = input.num_ib.replace(/[^0-9]/, '')

      if (num_ib !== '' && uniqueContacts.indexOf(num_ib) === -1) {
        contacts.push({
          type: 'TELEFONO',
          value: num_ib
        })
        uniqueContacts.push(num_ib)
      }
    }

    if (input.num_bd) {
      const num_bd = input.num_bd.replace(/[^0-9]/, '')

      if (num_bd !== '' && uniqueContacts.indexOf(num_bd) === -1) {
        contacts.push({
          type: 'TELEFONO',
          value: num_bd
        })
        uniqueContacts.push(num_bd)
      }
    }

    if (input.num_abc) {
      const num_abc = input.num_abc.replace(/[^0-9]/, '')

      if (num_abc !== '' && uniqueContacts.indexOf(num_abc) === -1) {
        contacts.push({
          type: 'TELEFONO',
          value: num_abc
        })
        uniqueContacts.push(num_abc)
      }
    }

    if (input.telefono_he && uniqueContacts.indexOf(input.telefono_he) === -1) {
      contacts.push({
        type: 'TELEFONO',
        value: input.telefono_he
      })
      uniqueContacts.push(input.telefono_he)
    }

    if (input.cellulare_he && uniqueContacts.indexOf(input.cellulare_he) === -1) {
      contacts.push({
        type: 'TELEFONO',
        value: input.cellulare_he
      })
      uniqueContacts.push(input.cellulare_he)
    }

    if (input.altro_numero_he && uniqueContacts.indexOf(input.altro_numero_he) === -1) {
      contacts.push({
        type: 'TELEFONO',
        value: input.altro_numero_he
      })
      uniqueContacts.push(input.altro_numero_he)
    }

    if (input.email && uniqueContacts.indexOf(input.email) === -1) {
      contacts.push({
        type: 'EMAIL',
        value: input.email
      })
      uniqueContacts.push(input.email)
    }

    if (input.fax && input.fax !== 'WEBAPP' && uniqueContacts.indexOf(input.fax) === -1) {
      contacts.push({
        type: 'FAX',
        value: input.fax
      })
    }

    return contacts
  }

  const ownerType = () => {
    if (isEmpty(input.codfis)) {
      return 'NINGUNO'
    }

    switch (input.codfis[0]) {
      case 'V':
        return 'VECINO'
      case 'P':
        return 'PRINCIPAL'
      case 'S':
        return 'SECUNDARIO'
    }
  }

  const name = input.ragionesociale || `NO Name ${input.id_fornitore}`

  const person = t.Person({
    id: uuid(),
    name,
    firstName: input.num_3,
    firstSurname: input.num_1,
    secondSurname: input.num_2,
    documentNumber: input.pariva,
    personType: personType(),
    contacts: contacts(),
    _migrateOwnerId: input.id_fornitore,
    _relatedTo: input.proprietari
  })

  const owner = Owner({
    id: uuid(),
    type: ownerType(),
    note: input.note,
    personId: person.id,
    person: person,
    name,
    _relatedTo: input.proprietari,
    _migrateId: input.id_fornitore
  })

  return { owner, person, input }
}

export function combineDuplicatesDocumentNumber (data) {
  const combinedData = []
  const owners = data.filter(({ _documentType }) => _documentType === 'owner')
  const people = data.filter(({ _documentType }) => _documentType === 'person')
  const peopleWithoutDocumentNumber = people.filter(({ documentNumber }) => isEmpty(documentNumber))
  const peopleWithDocumentNumber = people.filter(({ documentNumber }) => !isEmpty(documentNumber))

  let peopleToProcess = [].concat(peopleWithDocumentNumber)

  while (peopleToProcess.length > 0) {
    const [person] = peopleToProcess
    const combined = Object.assign({}, person)

    const filterSameDocumentDifferentPerson = ({ documentNumber, id }) => {
      return documentNumber === person.documentNumber && id !== person.id
    }

    const duplicates = peopleWithDocumentNumber.filter(filterSameDocumentDifferentPerson)

    duplicates.forEach(duplicated => {
      merge(combined, omit(JSON.parse(JSON.Stringingify(duplicated)), ['id']))
      const ownerIdx = owners.findIndex(o => o.personId === duplicated.id)
      if (ownerIdx !== -1) {
        owners[ownerIdx] = t.update(owners[ownerIdx], { personId: { $set: combined.id } })
      }
    })

    combinedData.push(combined)
    peopleToProcess = difference(peopleToProcess, duplicates.concat([person]))
  }

  return combinedData
    .concat(peopleWithoutDocumentNumber)
    .concat(owners)
}
