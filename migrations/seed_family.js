import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import uuid from 'uuid/v4';
import _ from 'lodash';
import couchbase from '../src/db/couchbase';
import {Owner, familyOwner} from '../src/types/owner';
import {resolve} from 'path';
import {OwnerRepository, PersonRepository} from '../src/owner/models';

import Promise from 'bluebird';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {OwnerType} from '../src/types/enums';
import {defaultFiles} from './defaults';

async function seedFamily(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };
  return processFamilyMembers(files, app);
}

export async function processFamilyMembers(files, app) {
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

  const personNeighborhoods = await findNeighborhoods(_.get(owner, 'person.addresses.0.fullAddress'));
  const buildingNeighborhoods = await findNeighborhoods(_.get(worksheet, 'relatedBuildings.0.address.fullAddress'));
  const neighborhoods = personNeighborhoods.concat(buildingNeighborhoods);

  const filteredNeighborhoods = _.reject(neighborhoods, filterOnWorksheet);

  const familyOwners = await createOwners(owner, filteredFamily, OwnerType.FAMILY);
  const neighborhoodOwners = await createOwners(owner, filteredNeighborhoods, OwnerType.NEIGHBOUR);

  const relatedOwners = await findRelatedOwners(owner);

  const newOwners = relatedOwners
    .concat(familyOwners)
    .concat(neighborhoodOwners);

  const repo = new WorksheetRepository();
  await Promise.map(newOwners, async(owner) => {
    try {
      await repo.addOwner(worksheet, owner);
    } catch (e) {
      console.error(`[processOwner] error adding ${owner.id} to ${worksheet.id}`, e);
    }
  });
}

async function findRelatedOwners(owner) {
  const name = _.get(owner, 'person.name');
  if (_.isNil(name)) {
    return [];
  }

  const repo = new OwnerRepository();
  const qb = repo.getQueryBuilder()
    .where('t._relatedTo = ?', owner.person.name)
    .where('t.buildingId IS MISSING');
  const ownersData = await repo.query(qb);
  const owners = ownersData.map(d => repo.toStruct(d));
  if (owners.length === 0) {
    return owners;
  }
  return Promise.map(owners, ownerToUpdate => updateOwnerFrom(ownerToUpdate, owner));
}

async function updateOwnerFrom(ownerToUpdate, fromOwner) {
  const repo = new OwnerRepository();
  const update = t.update(ownerToUpdate, {buildingId: {$set: fromOwner.buildingId}});
  await repo.save(update, false);
  return ownerToUpdate;
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
    .where('ANY v IN addresses SATISFIES v.fullAddress = ? END', fullAddress);
  return repo.query(qb);
}

async function findOwnerBy(personId, buildingId) {
  const repo = new OwnerRepository();
  const qb = repo.getQueryBuilder()
    .where('t.buildingId = ?', buildingId)
    .where('t.personId = ?', personId);
  const [personData] = await repo.query(qb);

  if (personData) {
    return repo.toStruct(personData);
  }

  return null;
}

async function createOwners(owner, people, type) {
  const repo = new OwnerRepository();
  return Promise.map(people, async(person) => {
    const personOwner = await findOwnerBy(person.id, owner.buildingId);
    if (personOwner) {
      return personOwner;
    }

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

if (require.main === module) {
  seedFamily(defaultFiles)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
