import fromJSON from 'tcomb/lib/fromJSON';
import uuid from 'uuid/v4';
import _ from 'lodash';
import couchbase from '../src/db/couchbase';
import {Owner, familyOwner} from '../src/types/owner';
import {resolve} from 'path';
import {MigratePersonModel} from '../src/migration/lib/migrate-person';
import {readCodigosPostalesMunicipios} from '../csv/codigos_postales_municipios';
import {OwnerRepository, PersonRepository} from '../src/owner/models';

import Promise from 'bluebird';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {OwnerType} from '../src/types/enums';

async function seedFamily(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };
  return processFamilyMembers(files, app);
}

export async function processFamilyMembers(files, app) {
  const codes = await readCodigosPostalesMunicipios();
  const migratePeople = new MigratePersonModel(files.people, codes, app);
  await migratePeople.run();

  const repo = new WorksheetRepository();
  const worksheets = await repo.query();
  const worksheetIds = _.map(worksheets, _.property('id'));
  await Promise.map(worksheetIds, processWorksheet, {concurrency: 2});
}

async function processWorksheet(worksheetId) {
  try {
    const repo = new WorksheetRepository();
    const worksheet = await repo.findByIdWIthIncludes(worksheetId);
    console.log('\n\nworksheet', worksheetId);
    console.log('people in worksheet', _.map(worksheet.relatedOwners, _.property('person.id')));
    const filteredOwners = worksheet.relatedOwners.filter(familyOwner);
    return Promise.map(filteredOwners, owner => processOwner(owner, worksheet));
  } catch (e) {
    console.log('error processing ', worksheetId, e);
  }
}

async function processOwner(owner, worksheet) {
  const owners = worksheet.relatedOwners;
  const currentPersons = _.map(owners, _.property('person.id'));
  const filterOnWorksheet = person => currentPersons.indexOf(person.id) !== -1;

  const family = await findFamilyName(owner.person);
  const filteredFamily = _.reject(family, filterOnWorksheet);
  const neighborhoods = await findNeighborhoods(_.get(owner, 'person.addresses.0.fullAddress'));
  const filteredNeighborhoods = _.reject(neighborhoods, filterOnWorksheet);

  const familyOwners = await createOwners(owner, filteredFamily, OwnerType.FAMILY);
  const neighborhoodOwners = await createOwners(owner, filteredNeighborhoods, OwnerType.NEIGHBOUR);

  const newOwners = familyOwners.concat(neighborhoodOwners);

  const repo = new WorksheetRepository();
  await Promise.map(newOwners, owner => repo.addOwner(worksheet, owner));

  // const justIds = collection => _.map(collection, _.property('id'));
  // console.log('owner', owner.id, 'person', owner.person.id);
  // console.log('family found', justIds(family));
  // console.log('filtered family', justIds(filteredFamily));
  // console.log('neighborhood found', justIds(neighborhoods));
  // console.log('filtered neighborhood', justIds(filteredNeighborhoods));
  // console.log('added owners', justIds(newOwners));
}

async function findFamilyName({id, firstSurname, secondSurname}) {
  if (_.isNil(firstSurname) || _.isNil(secondSurname)) {
    return [];
  }

  const repo = new PersonRepository();
  const qb = repo.getQueryBuilder()
    .where('id != ?', id)
    .where('LOWER(t.firstSurname) = LOWER(?)', firstSurname)
    .where('LOWER(t.secondSurname) = LOWER(?)', secondSurname);
  return repo.query(qb);
}

async function findNeighborhoods(fullAddress) {
  if (_.isNil(fullAddress)) {
    return [];
  }

  const repo = new PersonRepository();
  const qb = repo.getQueryBuilder()
    .where('t.addresses[0].fullAddress = ?', fullAddress);
  return repo.query(qb);
}

async function createOwners(owner, people, type) {
  const repo = new OwnerRepository();
  return Promise.map(people, person => {
    const rawOwner = Object.assign(owner, {
      id: uuid(),
      type,
      person: null,
      personId: person.id,
      _migrateId: null,
      confirmedByOperator: {
        value: false
      }
    });

    const newOwner = fromJSON(rawOwner, Owner);
    return repo.save(newOwner, false);
  });
}

const defaultFiles = {
  people: resolve(__dirname, '../csv/PERSONAS.csv'),
  buildings: resolve(__dirname, '../csv/EDIFICIOS.csv'),
  owners: resolve(__dirname, '../csv/PROPIETARIOS.csv'),
  calls: resolve(__dirname, '../csv/LLAMADAS.csv'),
  cross: resolve(__dirname, '../csv/cross_table.csv'),
  entities: resolve(__dirname, '../csv/SITARR.csv')
};

if (require.main === module) {
  console.log('starting seed');
  seedFamily(defaultFiles)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
