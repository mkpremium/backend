import debug from 'debug'
import t from 'tcomb'
import {OwnerRepository, PersonRepository} from '../../src/owner/models'
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3'
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper'
import uuid from 'uuid/v4'
import _ from 'lodash'
import {WorksheetRepository} from '../../src/worksheet/models/worksheet'
import {BuildingRepository} from '../../src/building/models'
import {readCodigosPostalesMunicipios} from '../../csv/codigos_postales_municipios'

const debugMigrate = debug('app:migration:person')
export const phonesPropertyNames = ['telefono_pb', 'telefono_ib', 'telefono_db', 'telefono_abc', 'tel_he', 'movil_he']

export const PersonInput = t.struct({
  ido: t.maybe(t.Str),
  provincia: t.maybe(t.Str),
  municipio: t.maybe(t.Str),
  apellido_1: t.maybe(t.Str),
  apellido_2: t.maybe(t.Str),
  nombre: t.maybe(t.Str),
  tipo_via: t.maybe(t.Str),
  nombre_via: t.maybe(t.Str),
  num_via: t.maybe(t.Str),
  bloque: t.maybe(t.Str),
  portal: t.maybe(t.Str),
  escalera: t.maybe(t.Str),
  piso: t.maybe(t.Str),
  puerta: t.maybe(t.Str),
  dia_naci: t.maybe(t.Str),
  mes_naci: t.maybe(t.Str),
  ano_naci: t.maybe(t.Str),
  cod_post: t.maybe(t.Str),
  nuc: t.maybe(t.Str),
  proprietari: t.maybe(t.Str),
  domicili: t.maybe(t.Str),
  telefono_pb: t.maybe(t.Str),
  telefono_ib: t.maybe(t.Str),
  telefono_db: t.maybe(t.Str),
  telefono_abc: t.maybe(t.Str),
  domicili_pb: t.maybe(t.Str),
  domicili_ib: t.maybe(t.Str),
  domicili_db: t.maybe(t.Str),
  domicili_abc: t.maybe(t.Str),
  sexo: t.maybe(t.Str),
  edad: t.maybe(t.Str),
  tel_he: t.maybe(t.Str),
  movil_he: t.maybe(t.Str),
  tipo_persona: t.maybe(t.Str),
  id_catastro: t.maybe(t.Str)
})

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function migratePersons (inputFile) {
  debugMigrate('Process started...')
  const codes = await readCodigosPostalesMunicipios()
  await csvToJSON(inputFile, doOnEachRow)

  async function doOnEachRow (personRecord) {
    const inputPerson = PersonInput(removeNullValues(cleanObjectKeys(personRecord)))
    try {
      await processPerson(inputPerson, codes)
    } catch (error) {
      console.error(error, ' in record with ido:', inputPerson.ido, ' and id catastro:', inputPerson.id_catastro)
    }
  }

  debugMigrate('Process ended.')
}

/**
 *
 * @param inputPerson - person csv row data
 * @param codes
 * @returns {Promise<void>}
 */
async function processPerson (inputPerson, codes) {
  debugMigrate('\n[NEW ROW] Process Person record with ido:', inputPerson.ido, ' and id catastro:', inputPerson.id_catastro)
  const personMigrateId = getFieldNotNull(inputPerson, 'ido')

  if (personMigrateId) {
    const person = await findPerson(personMigrateId)
    if (person) {
      debugMigrate(`Person found...`)
      await updatePersonContacts(person, inputPerson)
      debugMigrate(`Updated person contacts...continue to process relationship with worksheet...`)
      await processRelationWithWorksheet(person, inputPerson)
    } else {
      debugMigrate(`Person not found, proceed to create person and relations...`)
      await createPerson(inputPerson, codes)
    }
  }
}

/**
 *
 * @param person
 * @param inputPerson
 * @returns {Promise<void>}
 */
async function processRelationWithWorksheet (person, inputPerson) {
  const ownerRepository = new OwnerRepository()
  const owner = await ownerRepository.findByPersonId(person.id)

  if (owner) {
    debugMigrate(`Owner existed id...${owner.id}`)
    await processRelationOfOwnerWithBuilding(owner, person, inputPerson)
  } else {
    debugMigrate(`No records of ${ownerRepository._getMeta().defaultProps._documentType}
    found by personId: ${person.id}, proceed to create owner.`)
    await createOwnerAndRelations(person, inputPerson)
  }
}

/**
 * Process relation of owner, if the catastro of the migration record is different of the catastro of the
 * building related to the owner, it creates a new owner (relationship with the migration building
 * (indicated by the catastro id) nad it adds the owner to the worksheet.
 * @param owner
 * @param person
 * @param inputPerson
 * @returns {Promise<void>}
 */
async function processRelationOfOwnerWithBuilding (owner, person, inputPerson) {
  const buildingRepository = new BuildingRepository()
  let building = await buildingRepository.findById(owner.buildingId)
  const catastroId = inputPerson.id_catastro

  if (building.cadastre.reference !== catastroId) {
    debugMigrate(`Owner existed, but the related building does not have the same catastro id found in csv person record.`)
    // search building by catastro
    building = await buildingRepository.findBuildingByMetadataMigration(catastroId)

    if (building) {
      debugMigrate(`Process to create new relationship, meaning create a new owner and relationship with building with id:
       ${building.id}`)
      await createOwnerAndRelations(person, inputPerson)
    } else {
      debugMigrate(`No records of ${buildingRepository._getMeta().defaultProps._documentType}
                    found by catastro: ${catastroId}, ignoring record.`)
    }
  } else {
    debugMigrate(`Owner related building has same catastro id, process is completed.`)
  }
}

/**
 * Updates person contacts.
 * @param person
 * @param inputPerson
 * @returns {Promise<void>}
 */
export async function updatePersonContacts (person, inputPerson) {
  const currentContactsObjectsArray = person.contacts || []
  const currentPhones = currentContactsObjectsArray.map((contact) => {
    return contact.value
  })
  debugMigrate(`currentPhones...${currentPhones}`)
  const updatedContacts = currentContactsObjectsArray
  const migrationPhones = getUniquePhones(inputPerson) || []
  debugMigrate(`migrationPhones...${migrationPhones}`)
  const newPhones = _.difference(migrationPhones, currentPhones)

  if (newPhones.length) {
    debugMigrate(`new phones...${newPhones}`)

    newPhones.map((phone) => {
      updatedContacts.push({
        type: 'TELEFONO',
        value: phone
      })
    })

    debugMigrate(`updatedContacts...${JSON.stringify(updatedContacts, null, 2)}`)

    if (updatedContacts.length) {
      const personRepository = new PersonRepository()
      const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}})
      await personRepository.save(updatedPerson)
    }
  } else {
    debugMigrate(`No new phones to be added, proceed.`)
  }
}

/**
 * Validates a field in the input person cvs row.
 * @param inputPerson
 * @param field
 * @returns {*}
 */
export function getFieldNotNull (inputPerson, field) {
  const migrateId = removeNullValue(inputPerson[field])
  if (migrateId === null) {
    debugMigrate(`Invalid ${field} '${inputPerson[field]}', skip record\n: ${inputPerson}`)
  }
  return migrateId
}

/**
 * Creates a person, also the owner and association with worksheet.
 * @param inputPerson
 * @param codes
 * @returns {Promise<void>}
 */
export async function createPerson (inputPerson, codes) {
  const worksheet = await findWorksheetCatastroId(inputPerson)
  debugMigrate(`[createPerson] Worksheet found, id ${worksheet.id}`)
  const {person, owner} = await migrateFromCsv(inputPerson, worksheet, codes)
  const personRepository = new PersonRepository()
  await personRepository.save(person)
  debugMigrate(`Created person with id ${person.id}`)
  const ownerRepository = new OwnerRepository()
  await ownerRepository.save(owner)
  debugMigrate(`[createPerson] Created owner with id ${owner.id}`)
  const worksheetRepository = new WorksheetRepository()
  await worksheetRepository.addOwner(worksheet, owner)
  debugMigrate(`[createPerson] Added owner to worksheet with id ${worksheet.id}`)
}

/**
 * Creates owner and relations.
 * @param person
 * @param inputPerson
 * @returns {Promise<void>}
 */
export async function createOwnerAndRelations (person, inputPerson) {
  const worksheet = await findWorksheetCatastroId(inputPerson)
  debugMigrate(`[createOwnerAndRelations] Worksheet found, id ${worksheet.id}`)
  const owner = generateOwner(inputPerson, person, worksheet)
  const ownerRepository = new OwnerRepository()
  await ownerRepository.save(owner)
  debugMigrate(`[createOwnerAndRelations] Created owner with id ${owner.id}`)
  const worksheetRepository = new WorksheetRepository()
  await worksheetRepository.addOwner(worksheet, owner)
  debugMigrate(`[createOwnerAndRelations] Added owner to worksheet with id ${worksheet.id}`)
}

/**
 * Finds worksheet by catastro.
 * @param inputPerson
 * @returns {Promise<*>}
 */
export async function findWorksheetCatastroId (inputPerson) {
  const catastroId = getFieldNotNull(inputPerson, 'id_catastro')
  return findWorksheetByCatastro(catastroId)
}

/**
 * Finds worksheet by id catastro.
 * @param catastroId
 * @returns {Promise<*>}
 */
export async function findWorksheetByCatastro (catastroId) {
  const [building] = await findBuilding(catastroId)
  debugMigrate(`Building found, now look for worksheet...`)
  return findWorksheet(building.id)
}

/**
 * Finds building by id catastro.
 * @param catastroId
 * @returns {Promise<*>}
 */
async function findBuilding (catastroId) {
  const buildingRepository = new BuildingRepository()
  return buildingRepository.findByMigratedId(catastroId)
}

/**
 * Finds worksheet by building id.
 * @param buildingId
 * @returns {Promise<*>}
 */
async function findWorksheet (buildingId) {
  const repo = new WorksheetRepository()
  const worksheet = await repo.findWorksheetByBuilding(buildingId)
  if (!worksheet) {
    throw new Error(`Could not find worksheet for building ${buildingId}`)
  }

  return repo.findByIdWIthIncludes(worksheet.id)
}

/**
 * Find person by ido(migrate id)
 * @param personMigrateId - is the field ido in the csv
 * @returns {Promise<*>}
 */
async function findPerson (personMigrateId) {
  const personRepository = new PersonRepository()
  const [person] = await personRepository.findByMigratedId(personMigrateId, false)
  return person
}

/**
 * Generates the contacts phones
 * @param inputPerson
 * @returns {Array}
 */
const generateContactsNoDuplicates = (inputPerson) => {
  const contacts = []
  let phones = getUniquePhones(inputPerson)

  phones.map((phone) => {
    contacts.push({
      type: 'TELEFONO',
      value: phone
    })
  })

  return contacts
}

/**
 * Creates the person and owner structs base on the csv record of a person
 * @param inputPerson
 * @param worksheet
 * @param codes
 * @returns {{owner: *, person: *}}
 */
export function migrateFromCsv (inputPerson, worksheet, codes) {
  const name = `${_.get(inputPerson, 'apellido_1', '')} ${_.get(inputPerson, 'apellido_2', '')} ${_.get(inputPerson, 'nombre', '')}`
    .trim()
    .replace(/\s+/g, ' ')

  const address = generateAddress(inputPerson, codes)

  const person = t.Person({
    id: uuid(),
    name,
    firstName: _.get(inputPerson, 'nombre', ''),
    firstSurname: _.get(inputPerson, 'apellido_1', ''),
    secondSurname: _.get(inputPerson, 'apellido_2', ''),
    birthDate: birthDate(inputPerson),
    birthYear: !isEmpty(inputPerson.ano_naci) ? Number(inputPerson.ano_naci) : 0,
    addresses: [address],
    _address: address,
    contacts: generateContactsNoDuplicates(inputPerson),
    gender: gender(inputPerson),
    personType: 'NATURAL',
    _relatedTo: inputPerson.proprietari,
    _migrateId: inputPerson.ido
  })
  const owner = generateOwner(inputPerson, person, worksheet)

  return {owner, person}
}

/**
 * Generates struct of owner.
 * @param inputPerson
 * @param person
 * @param worksheet
 * @returns {*}
 */
function generateOwner (inputPerson, person, worksheet) {
  return t.Owner({
    id: uuid(),
    type: inputPerson.tipo_persona,
    note: inputPerson.domicili,
    personId: person.id,
    person: person,
    name: person.name,
    _relatedTo: inputPerson.proprietari,
    _migrateId: inputPerson.ido,
    buildingId: _.first(worksheet.relatedBuildingIds)
  })
}

/**
 *
 * @param inputPerson
 * @returns {Array}
 */
function getUniquePhones (inputPerson) {
  let phones = []

  phonesPropertyNames.map((propertyName) => {
    if (inputPerson[propertyName]) {
      phones.push(inputPerson[propertyName])
    }
  })

  return _.uniq(phones)
}

/**
 * Generates address object
 * @param input
 * @param codes
 * @returns {{fullAddress: *, floor: *, number: *, postalCode: *, city: null}}
 */
function generateAddress (input, codes) {
  const postalCode = input.cod_post ? input.cod_post.padStart(5, '0') : null
  const info = postalCode ? codes.findByPostalCode(postalCode) : null
  const city = info ? info['nombre_entidad_singular'] : null
  return ({
    fullAddress: input.domicili,
    floor: input.piso,
    number: input.puerta,
    postalCode,
    city
  })
}

/**
 *
 * @param inputPerson
 * @returns {string}
 */
function gender (inputPerson) {
  const value = inputPerson.sexo || ''
  switch (value.toUpperCase()) {
    case 'H':
      return 'MASCULINO'
    case 'M':
      return 'FEMENINO'
    default:
      return 'NINGUNO'
  }
}

/**
 *
 * @param value
 * @returns {boolean}
 */
function isEmpty (value) {
  return typeof value === 'undefined' || value == null || value === ''
}

/**
 *
 * @param inputPerson
 * @returns {*}
 */
function birthDate (inputPerson) {
  if (isEmpty(inputPerson.ano_naci) || isEmpty(inputPerson.mes_naci) || isEmpty(inputPerson.dia_naci)) {
    return null
  }
  return new Date(`${inputPerson.ano_naci}-${inputPerson.mes_naci}-${inputPerson.dia_naci}`)
}
