import debug from 'debug';
import t from 'tcomb';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper';
import uuid from 'uuid/v4';
import _ from 'lodash';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import {BuildingRepository} from '../../src/building/models';
import Promise from "bluebird";
import {OperatorStats} from "../../src/stats/models";
import {OperatorActions} from "../../src/stats/types";
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
 * Creates building, worksheet, owner and person.
 * @param input
 * @returns {Promise<void>}
 */
async function createAll(input) {
  const ownerRepository = new OwnerRepository();
  const personRepository = new PersonRepository();
  const {owners, building, worksheet} = await generateObjects(input);
  console.log('owners', owners);
  console.log('building', building);
  console.log('worksheet', worksheet);
  
  debugMigrate('Creating building with id:', building.id);
  const buildingRepository = new BuildingRepository();
  await buildingRepository.save(building, false);
  
  debugMigrate('Creating worksheet with id:', worksheet.id);
  const worksheetRepository = new WorksheetRepository();
  await worksheetRepository.save(worksheet, false);
  
  await Promise.map(owners, async (ownerAndPerson) => {
    await personRepository.save(ownerAndPerson.person);
    debugMigrate('Created person with id: ', ownerAndPerson.person.id);
    
    await ownerRepository.save(ownerAndPerson.owner);
    debugMigrate('Created owner with id: ', ownerAndPerson.owner.id);
  });
}


/**
 *
 * @param value
 * @returns {number}
 */
const number = value => {
  if (value) {
    const number = Number(value.replace(',', '.'));
    return isNaN(number) ? 0 : number;
  }
  
  return 0;
};

/**
 *
 * @param input
 * @returns {Promise<{owners: Array, building: *, worksheet: *}>}
 */
async function generateObjects(input) {
  const buildingId = uuid();
  const owners = [];
 
  
  for (let i = 1; i <= 10; i++) {
    const name = _.get(input, 'propietario' + i, '');
    
    if (name) {
      const address = {
        fullAddress: _.get(input, 'direccion' + i, '')
      };
      
      const person = t.Person({
        id: uuid(),
        name,
        documentNumber: _.get(input, 'dni' + i, ''),
        addresses: [address],
        _address: address,
        personType: 'NONE',
        _relatedTo: owners.length ? owners[0].person.name : name,
        _migrateId: input.id_finca
      });
      
      const owner = t.Owner({
        id: uuid(),
        type: owners.length ? 'SECUNDARIO' : 'PRINCIPAL',
        note: address.fullAddress,
        personId: person.id,
        person: person,
        name: person.name,
        _relatedTo: person._relatedTo,
        _migrateId: person._migrateId,
        buildingId: buildingId
      });
      
      owners.push({
        owner,
        person
      });
    }
  }
  
  const geodata = await getGeoData(input);
  let relatedTo = '';
  let ownerForBuilding = null;
  let ownerId = null;
  if (owners.length) {
    relatedTo = owners[0].owner._relatedTo;
    ownerId =  owners[0].owner.id;
    ownerForBuilding = {
      name: owners[0].person.name,
      address: {
        fullAddress: owners[0].person._address.fullAddress
      }
    }
  }
  
  const building = t.Building({
    id: buildingId,
    _migrateId: input.id_finca,
    _relatedTo: relatedTo,
    address: {
      street: input.calle,
      number: number(input.no),
      fullAddress: input.calle + ' ' + input.no,
      postalCode: {
        number: (geodata && geodata.postalCode) || null
      } ,
      city: input.ciudad,
      province: input.ciudad,
      neighborhood: input.barrio,
      registerNumber: null,
      type: null
    },
    buildingType: 'VERTICAL',
    cadastre: {
      reference: input.id_finca,
      address: input.calle + ' ' + input.no
    },
    location: {
      lat: (geodata && geodata.latitude) || null,
      lng: (geodata && geodata.longitude) || null
    },
    ownerId: ownerId,
    owner: ownerForBuilding,
    state: 'BUENO',
    elements: {
      number: 0,
      average: 0,
      commons: 0
    },
    use: null,
    propertyType: null
  });
  
  const worksheet = t.WorkSheet({
    id: uuid(),
    _relatedTo: building.owner && building.owner.name,
    relatedBuildingIds: [building.id],
    relatedOwnerIds: _.map(owners, 'owner.id'),
    buildingAddress: building.address,
    status: 'INVALID',
    queueId: null
  });
  
  return {owners, building, worksheet};
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
