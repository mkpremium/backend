import debug from 'debug';
import t from 'tcomb';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import Promise from 'bluebird';
import {WorkSheetStatus} from '../../src/types/worksheet';
import fromJSON from 'tcomb/lib/fromJSON';
import _ from 'lodash';
import {N1qlQuery} from "couchbase";
import {BuildingRepository} from "../../src/building/models";
import {getFieldNotNull} from "./migrate-persons";

const debugMigrate = debug('app:migration:owners:v2');

export const Input = t.struct({
  id_fornitore: t.maybe(t.Str), // building._migrateId
  id_catastro: t.maybe(t.Str)   // owner._migrateId
});

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
    const input = Input(removeNullValues(cleanObjectKeys(record)));
    
    try {
      await processOwner(input);
      ownersThatWereRelated.push(input);
    } catch (error) {
      console.error(error, ' in record with id_fornitore:', input.id_fornitore);
      ownersWithErrors.push({
        input: input,
        error: error && error.toString()
      })
    }
  }
  
  debugMigrate('Owners with errors:', JSON.stringify(ownersWithErrors, null, 2));
  debugMigrate('Owners that were related:', JSON.stringify(ownersThatWereRelated, null, 2));
  debugMigrate('Count owners that were related:', ownersThatWereRelated.length);
  debugMigrate('Process ended.');
}

/**
 *
 * @param input - csv row data
 * @returns {Promise<void>}
 */
async function processOwner(input) {
  debugMigrate('\n[NEW ROW] Process owner record with id_fornitore:', input.id_fornitore);
  const ownerMigrateId = getFieldNotNull(input, 'id_fornitore');
  const ownerRepository = new OwnerRepository();
  const owner = await ownerRepository.findByMigratedId(ownerMigrateId);
  
  if (owner) {
    debugMigrate(`Owner found...`);
    if (!owner.buildingId) {
      await processOwnerRelation(input, owner);
      debugMigrate('\nProcess ended for owner record with id_fornitore:', input.id_fornitore);
    } else {
      debugMigrate(`Owner already with a building relationship:`, input.id_fornitore);
      throw new Error(`Owner already with a building relationship.`);
    }
  }
}


/**
 *
 * @param input
 * @param owner
 * @returns {Promise<void>}
 */
async function processOwnerRelation(input, owner) {
  const worksheetRepository = new WorksheetRepository();
  const ownerRepository = new OwnerRepository();
  const buildingRepository = new BuildingRepository();
  const documentType = 'owner';
  const buildingMigrateId = getFieldNotNull(input, 'id_catastro');
  const [building] = await buildingRepository.findByMigratedId(buildingMigrateId);
  let worksheet = await worksheetRepository.findWorksheetByBuilding(building.id);
  
  if (worksheet) {
    // associate owner with building found by id_catastro
    const bucket = ownerRepository.getBucketName();
    const updateOwner = N1qlQuery
    .fromString(`UPDATE ${bucket} SET buildingId = ${JSON.stringify(building.id)} WHERE _documentType = ${JSON.stringify(documentType)} and id = ${JSON.stringify(owner.id)}`);
  
    await ownerRepository.queryRaw(updateOwner);
    await worksheetRepository.addOnlyOwner(worksheet, owner);
  } else {
    debugMigrate(`Building found but worksheet not found, id fornitore:`, input.id_fornitore);
    throw new Error(`Building found but worksheet not found.`);
  }
}
