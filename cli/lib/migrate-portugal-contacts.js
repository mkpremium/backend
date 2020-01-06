import debug from 'debug'
import t from 'tcomb'
import {OwnerRepository, PersonRepository} from '../../src/owner/models'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper'
import {WorksheetRepository} from '../../src/worksheet/models/worksheet'
import fromJSON from 'tcomb/lib/fromJSON'
import _ from 'lodash'
import {OwnerStatus} from '../../src/types/enums'

const debugMigrate = debug('app:migration:portugal:contacts')

export const Input = t.struct({
  no: t.maybe(t.Str),
  tel1: t.maybe(t.Str),
  tel2: t.maybe(t.Str),
  tel3: t.maybe(t.Str),
  tel4: t.maybe(t.Str),
  tel5: t.maybe(t.Str),
  tel6: t.maybe(t.Str),
  tel7: t.maybe(t.Str),
  tel8: t.maybe(t.Str),
  tel9: t.maybe(t.Str),
  tel10: t.maybe(t.Str),
  tel11: t.maybe(t.Str),
  tel12: t.maybe(t.Str),
  tel13: t.maybe(t.Str)
})

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function migrate (inputFile) {
  debugMigrate('Process started...')
  const contactsWithErrors = []
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (record) {
    const input = Input(removeNullValues(cleanObjectKeys(record)))
    try {
      await processContacts(input)
    } catch (error) {
      console.error(error, ' in record with no:', input.no)
      contactsWithErrors.push({
        person: input.no,
        error: error && error.toString()
      })
    }
  }

  debugMigrate('Contacts with errors:', JSON.stringify(contactsWithErrors, null, 2))
  debugMigrate('Process ended.')
}

/**
 *
 * @param input - csv row data
 * @returns {Promise<void>}
 */
async function processContacts (input) {
  debugMigrate('\n[NEW ROW] Process person record with no/dni:', input.no)
  const dni = getFieldNotNull(input, 'no')

  if (dni) {
    const persons = await findPersons(dni)
    if (persons.length > 0) {
      debugMigrate(`Persons found...`)
      await updatePersonAndWorksheet(input, persons)
      debugMigrate('\nProcess ended for person record with dni no:', input.no)
    } else {
      debugMigrate(`Person not found, skip row no/dni:`, input.no)
      throw new Error(`Person not found .`)
    }
  }
}

/**
 * Finds all persons by dni.
 * @param dni
 * @returns {Promise<*>}
 */
async function findPersons (dni) {
  const personRepository = new PersonRepository()
  return personRepository.findAllByDocumentNumber(dni, false)
}

/**
 *
 * @param input
 * @param person
 * @returns {Promise<void>}
 */
async function updatePersonAndWorksheet (input, persons) {
  for (let x = 0; x < persons.length; x++) {
    const person = persons[x]
    await updatePerson(input, person)
    await updateWorksheet(person)
  }
}

async function updatePerson (input, person) {
  const personRepository = new PersonRepository()
  const contacts = []
  let phonesArray = []

  for (let i = 1; i <= 13; i++) {
    const phone = input['tel' + i]

    if (phone) {
      contacts.push({
        type: 'TELEFONO',
        value: phone
      })
      phonesArray.push(phone)
    }
  }

  if (contacts.length === 0) {
    throw new Error(`No contacts found in csv.`)
  }
  const currentContactsObjectsArray = person.contacts || []
  const currentPhones = currentContactsObjectsArray.map((contact) => {
    return contact.value
  })
  debugMigrate(`currentPhones...${currentPhones}`)
  const updatedContacts = currentContactsObjectsArray
  const migrationPhones = _.uniq(phonesArray)
  debugMigrate(`migrationPhones...${migrationPhones}`)
  const newPhones = _.difference(migrationPhones, currentPhones)

  if (newPhones.length === 0) {
    debugMigrate(`No new phones to be added, proceed.`)
    return person
  }
  debugMigrate(`new phones...${newPhones}`)

  newPhones.map((phone) => {
    updatedContacts.push({
      type: 'TELEFONO',
      value: phone
    })
  })

  debugMigrate(`updatedContacts...${JSON.stringify(updatedContacts, null, 2)}`)
  const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}})
  await personRepository.save(updatedPerson)
}
async function updateWorksheet (person) {
  const ownerRepository = new OwnerRepository()
  const worksheetRepository = new WorksheetRepository()
  const owner = await ownerRepository.findByPersonId(person.id)

  if (!owner) {
    debugMigrate(`Owner not found ${person.id}`)
    return true
  }

  if (owner.status === OwnerStatus.ERROR) {
    const updatedOwner = t.update(owner, {status: {$set: OwnerStatus.NON_VERIFIED}})
    await ownerRepository.save(updatedOwner)
  }

  let worksheet = await worksheetRepository.findWorksheetByOwner(owner.id)
  if (!worksheet) {
    debugMigrate(`Worksheet not found for ${owner.id}`)
    return true
  }
  worksheet = fromJSON(worksheet, t.WorkSheet)

  debugMigrate('worksheet id', worksheet.id, 'with status', worksheet.status)

  return true
}

/**
 * Validates a field in the input cvs row.
 * @param input
 * @param field
 * @returns {*}
 */
export function getFieldNotNull (input, field) {
  const value = removeNullValue(input[field])
  if (value === null) {
    debugMigrate(`Invalid ${field} '${input[field]}', skip record\n: ${input}`)
  }
  return value
}
