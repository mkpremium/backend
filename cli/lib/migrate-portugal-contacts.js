import debug from 'debug';
import t from 'tcomb';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import Promise from "bluebird";
import {WorkSheetStatus} from "../../src/types/worksheet";
import fromJSON from "tcomb/lib/fromJSON";

const debugMigrate = debug('app:migration:portugal:contacts');

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
  tel13: t.maybe(t.Str),
});

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function migrate(inputFile) {
  debugMigrate('Process started...');
  const contactsWithErrors = [];
  await csvToJSON(inputFile, doOnEachRow);
  
  
  async function doOnEachRow(record) {
    const input = Input(removeNullValues(cleanObjectKeys(record)));
    try {
      await processContacts(input);
    } catch (error) {
      console.error(error, ' in record with no:', input.no);
      contactsWithErrors.push({
        person: input.no,
        error: error && error.toString()
      })
    }
  }
  
  debugMigrate('Contacts with errors:', JSON.stringify(contactsWithErrors, null, 2));
  debugMigrate('Process ended.');
}

/**
 *
 * @param input - csv row data
 * @returns {Promise<void>}
 */
async function processContacts(input) {
  debugMigrate('\n[NEW ROW] Process person record with no/dni:', input.no);
  const dni = getFieldNotNull(input, 'no');
  
  if (dni) {
    const person = await findPerson(dni);
    if (person) {
      debugMigrate(`Person found...`);
      await updatePersonAndWorksheet(input, person);
      debugMigrate('\nProcess ended for person record with dni no:', input.no);
    } else {
      debugMigrate(`Person not found, skip row no/dni:`, input.no);
      throw new Error(`Person not found .`);
    }
  }
}

/**
 * Finds person by dni.
 * @param dni
 * @returns {Promise<*>}
 */
async function findPerson(dni) {
  const personRepository = new PersonRepository();
  return personRepository.findByDocumentNumber(dni, false);
}

/**
 *
 * @param input
 * @param person
 * @returns {Promise<void>}
 */
async function updatePersonAndWorksheet(input, person) {
  const personRepository = new PersonRepository();
  const ownerRepository = new OwnerRepository();
  const worksheetRepository = new WorksheetRepository();
  const contacts = [];
  
  for (let i = 1; i <= 13; i++) {
    const phone = input['tel' + i];
    
    if (phone) {
      contacts.push({
        type: 'TELEFONO',
        value: input['tel' + i]
      });
    }
  }
  
  if (contacts.length) {
    const updatedPerson = t.update(person, {contacts: {$merge: contacts}});
    await personRepository.save(updatedPerson);
    const owner = await ownerRepository.findByPersonId(person.id);
    
    if (owner) {
      let worksheet = await worksheetRepository.findWorksheetByOwner(owner.id);
      if (worksheet) {
        worksheet = fromJSON(worksheet, t.WorkSheet);
        const updatedWorksheet = worksheet.setStatus(WorkSheetStatus.DEFAULT);
        await worksheetRepository.save(updatedWorksheet);
      } else {
        throw new Error(`Worksheet not found.`);
      }
    } else {
      throw new Error(`Owner not found.`);
    }
  } else {
    throw new Error(`No contacts found in csv.`);
  }
}

/**
 * Validates a field in the input cvs row.
 * @param input
 * @param field
 * @returns {*}
 */
export function getFieldNotNull(input, field) {
  const value = removeNullValue(input[field]);
  if (value === null) {
    debugMigrate(`Invalid ${field} '${input[field]}', skip record\n: ${input}`);
  }
  return value;
}
