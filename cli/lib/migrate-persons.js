import debug from 'debug';
import t from 'tcomb';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper';
import uuid from 'uuid/v4';
import _ from 'lodash';
import {WorksheetRepository} from "../../src/worksheet/models/worksheet";
import {BuildingRepository} from "../../src/building/models";

const debugMigrate = debug('app:migration:person');
export const phonesPropertyNames = ['telefono_pb', 'telefono_ib', 'telefono_db', 'telefono_abc', 'tel_he', 'movil_he'];

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
  id_catastro: t.maybe(t.Str),
});

export async function migratePersons(inputFile) {
  debugMigrate('Process started...');
  await csvToJSON(inputFile, doOnEachRow);
  
  async function doOnEachRow(personRecord) {
    const inputPerson = PersonInput(removeNullValues(cleanObjectKeys(personRecord)));
    try {
      await processPerson(inputPerson);
    } catch(error) {
      console.error(error.toString(), ' in record with ido:', inputPerson.ido, ' and id catastro:', inputPerson.id_catastro);
    }
  }
  
  debugMigrate('Process ended.');
}

/**
 *
 * @param inputPerson - person csv row data
 * @returns {Promise<void>}
 */
async function processPerson(inputPerson) {
  debugMigrate('Process Person record with ido:', inputPerson.ido, ' and id catastro:', inputPerson.id_catastro);
  const personMigrateId = getFieldNotNull(inputPerson, 'ido');
  console.log('personMigrateId', personMigrateId);
  
  if (personMigrateId) {
    const person = await findPerson(personMigrateId);
    if (person) {
      await updatePersonContacts(person, inputPerson);
      await processRelationWithWorksheet(person, inputPerson);
    } else {
      await createPerson(inputPerson);
    }
  }
}

async function processRelationWithWorksheet(person, inputPerson) {
  const ownerRepository = new OwnerRepository();
  const owner = ownerRepository.findByPersonId(person.id);
  
  if (owner) {
    await processRelationOfOwnerWithBuilding(owner, person, inputPerson);
  } else {
    debugMigrate(`No records of ${ownerRepository._getMeta().defaultProps._documentType}
    found by personId: ${person.id}, proceed to create owner.`);
    await createOwnerAndRelations(person, inputPerson);
  }
}

async function processRelationOfOwnerWithBuilding(owner, person, inputPerson) {
  const buildingRepository = new BuildingRepository();
  let building = buildingRepository.findById(person.buildingId);
  const catastroId = inputPerson.id_catastro;
  
  if (building.cadastre.reference !== catastroId) {
   
   // search building by catastro
    building = await buildingRepository.findBuildingByMetadataMigration(catastroId);
    
    if (building) {
      await createOwnerAndRelations(person, inputPerson);
    } else {
      debugMigrate(`No records of ${buildingRepository._getMeta().defaultProps._documentType}
                    found by catastro: ${catastroId}, ignoring record.`);
    }
  }
}

export async function updatePersonContacts(person, inputPerson) {
  const currentContactsObjects = person.contacts || [];
  const currentPhones = currentContactsObjects.map((contact) => {
    return contact.value;
  });
  const updatedContacts = [];
  const migrationPhones = getUniquePhones(inputPerson);
  const newPhones = _.difference(currentPhones, migrationPhones);
  
  newPhones.map((phone) => {
    updatedContacts.push({
      type: 'TELEFONO',
      value: phone
    });
  });
  
  if (updatedContacts.length) {
    const personRepository = new PersonRepository();
    const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}});
    await personRepository.save(updatedPerson);
  }
}

export function getFieldNotNull(inputPerson, field) {
  const migrateId = removeNullValue(inputPerson[field]);
  if (migrateId === null) {
    debugMigrate(`Invalid ${field} '${inputPerson[field]}', skip record\n: ${inputPerson}`);
  }
  return migrateId;
}

/**
 * Creates a person, also the owner and association with worksheet.
 * @param inputPerson
 * @returns {Promise<void>}
 */
export async function createPerson(inputPerson) {
  const worksheet = await findWorksheetCatastroId(inputPerson);
  const {person, owner} = await migrateFromCsv(inputPerson, worksheet);
  const personRepository = new PersonRepository();
  await personRepository.save(person);
  const ownerRepository = new OwnerRepository();
  await ownerRepository.save(owner);
  const worksheetRepository = WorksheetRepository();
  await worksheetRepository.addOwner(worksheet, owner);
}

/**
 *
 * @param person
 * @param inputPerson
 * @returns {Promise<void>}
 */
export async function createOwnerAndRelations(person, inputPerson) {
  const worksheet = await findWorksheetCatastroId(inputPerson);
  const owner = generateOwner(inputPerson, person, worksheet);
  const ownerRepository = new OwnerRepository();
  await ownerRepository.save(owner);
  const worksheetRepository = WorksheetRepository();
  await worksheetRepository.addOwner(worksheet, owner);
}

/**
 * Finds worksheet by catastro.
 * @param inputPerson
 * @returns {Promise<*>}
 */
export async function findWorksheetCatastroId(inputPerson) {
  const catastroId = getFieldNotNull(inputPerson, 'id_catastro');
  return findWorksheetByCatastro(catastroId);
}

export async function findWorksheetByCatastro(catastroId) {
  const [building] = await findBuilding(catastroId);
  debugMigrate(`Building found, now look for worksheet...`);
  return findWorksheet(building.id);
}

async function findBuilding(catastroId) {
  const buildingRepository = new BuildingRepository();
  return buildingRepository.findByCatastroId(catastroId);
}

async function findWorksheet(buildingId) {
  const repo = new WorksheetRepository();
  const worksheet = await repo.findWorksheetByBuilding(buildingId);
  if (!worksheet) {
    throw new Error(`Could not find worksheet for building ${buildingId}`);
  }
  
  return repo.findByIdWIthIncludes(worksheet.id);
}

/**
 * Find person by ido(migrate id)
 * @param personMigrateId - is the field ido in the csv
 * @returns {Promise<*>}
 */
async function findPerson(personMigrateId) {
  const personRepository = new PersonRepository();
  const [person] = await personRepository.findByMigratedId(personMigrateId, false);
  return person;
}

/**
 * Creates the person and owner structs base on the csv record of a person
 * @param inputPerson
 * @param worksheet
 * @returns {{owner: *, person: *}}
 */
export function migrateFromCsv(inputPerson, worksheet) {
  const name = [inputPerson.apellido_1, inputPerson.apellido_2, inputPerson.name].join(' ');
  const person = t.Person({
    id: uuid(),
    name,
    firstName: inputPerson.nombre,
    firstSurname: inputPerson.apellido_1,
    secondSurname: inputPerson.apellido_2,
    contacts: generateContactsNoDuplicates(inputPerson),
    _relatedTo: inputPerson.proprietari,
    _migrateOwnerId: inputPerson.ido,
    _migrateId: inputPerson.ido,
    birthYear: inputPerson.ano_naci && Number(inputPerson.ano_naci)
  });
  const owner = generateOwner(inputPerson, person, worksheet);
  
  return {owner, person};
}

/**
 * Generates struct of owner.
 * @param inputPerson
 * @param person
 * @param worksheet
 * @returns {*}
 */
function generateOwner(inputPerson, person, worksheet) {
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
  });
}

/**
 *
 * @param inputPerson
 * @returns {Array}
 */
function getUniquePhones(inputPerson) {
  let phones = [];
  
  phonesPropertyNames.map((propertyName) => {
    if (inputPerson[propertyName]) {
      phones.push(inputPerson[propertyName]);
    }
  });
  
  return _.uniq(phones);
}

/**
 *
 * @param inputPerson
 * @returns {Array}
 */
const generateContactsNoDuplicates = (inputPerson) => {
  const contacts = [];
  let phones = getUniquePhones(inputPerson);
  
  phones.map((phone) => {
    contacts.push({
      type: 'TELEFONO',
      value: phone
    });
  });
  
  return contacts;
};
