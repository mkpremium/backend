import debug from 'debug';
import t from 'tcomb';
import {ContactStatus, OwnerRepository, PersonRepository} from '../../src/owner/models';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import Promise from 'bluebird';
import {WorkSheetStatus} from '../../src/types/worksheet';
import {N1qlQuery} from "couchbase";
import {BuildingRepository} from '../../src/building/models';
import {getFieldNotNull} from './migrate-persons';
import parse from '../../src/migration/models/owner';
import {OwnerStatus} from '../../src/types/enums';

const debugMigrate = debug('app:migration:owners:v3');

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function migrateOwners(inputFile) {
  debugMigrate('Process started...', inputFile);
  const ownersThatWereRelated = [];
  const ownersWithErrors = [];
  await csvToJSON(inputFile, doOnEachRow);
  
  async function doOnEachRow(record) {
    let {person, owner, input} = parse(record);
  
    try {
        const {personSaved, ownerSaved, updatedWorksheet} = await processOwner(input, owner, person);
        ownersThatWereRelated.push({
          person: personSaved,
          owner: ownerSaved,
          worksheet: updatedWorksheet
        });
    } catch (error) {
      console.error(error, ' in record with id_fornitore:', input.id_fornitore);
      ownersWithErrors.push({
        input: input,
        error: error && error.toString()
      });
    }
  }
  
  debugMigrate('Owners that were related:', JSON.stringify(ownersThatWereRelated, null, 2));
  debugMigrate('Owners with errors:', JSON.stringify(ownersWithErrors, null, 2));
  debugMigrate('Count owners that were related:', ownersThatWereRelated.length);
  debugMigrate('Process ended.');
}

/**
 *
 * @param input
 * @param owner
 * @param person
 * @returns {Promise<{ownerSaved: *, personSaved: *, updatedWorksheet: *}>}
 */
async function processOwner(input, owner, person) {
  const worksheetRepository = new WorksheetRepository();
  const buildingRepository = new BuildingRepository();
  const personRepository = new PersonRepository();
  const ownerRepository = new OwnerRepository();
  const buildingMigrateId = getFieldNotNull(input, 'id_catastro');
  const [building] = await buildingRepository.findByMigratedId(buildingMigrateId);
  let worksheet = await worksheetRepository.findWorksheetByBuilding(building.id);
  
  if (worksheet) {
    person = t.update(person, {
      $merge: Object.assign({}, {
        _secondMigration: true,
        _verifiedOwnerMigrateId: owner._migrateId,
        _migrateOwnerId: null
      })});
    owner = t.update(owner, {
      $merge: Object.assign({}, {
        status: OwnerStatus.VERIFIED,
        _secondMigration: true,
        buildingId: building.id,
        note: input.street || null,
        _verifiedMigrateId: owner._migrateId,
        _migrateId: null
      }, {
        confirmedByOperator: {
          value: true,
          confirmedBy: 'migrate',
          confirmedAt: new Date()
        }
      })
    });
    
    const currentContactsObjectsArray = person.contacts;
    const updatedContacts = [];
    
    if (currentContactsObjectsArray.length) {
      currentContactsObjectsArray.map((contact) => {
        const updatedContact = t.update(contact, {status: {$set: ContactStatus.GOOD}});
        updatedContacts.push(updatedContact);
      });
      
      person = t.update(person, {contacts: {$merge: updatedContacts}});
    }
    
    const personSaved = await personRepository.save(person, false);
    const ownerSaved = await ownerRepository.save(owner, false);
    let updatedWorksheet = await worksheetRepository.addOnlyOwner(worksheet, owner);
  
    if (worksheet.status === WorkSheetStatus.INVALID) {
      const bucket = worksheetRepository.getBucketName();
      const updateStatus = N1qlQuery
      .fromString(`UPDATE ${bucket} t SET status = ${JSON.stringify(WorkSheetStatus.WITH_OWNER)} WHERE id = ${JSON.stringify(worksheet.id)}`);
  
      await worksheetRepository.queryRaw(updateStatus);
      updatedWorksheet = worksheetRepository.findById(worksheet.id);
    }
    
    return {
      personSaved,
      ownerSaved,
      updatedWorksheet
    };
  } else {
    throw new Error(`Building found but worksheet not found. ${building.id}`,);
  }
}
