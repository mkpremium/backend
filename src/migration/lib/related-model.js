import uuid from 'uuid/v4';
import t from 'tcomb';
import Promise from 'bluebird';
import _ from 'lodash';

import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {BuildingRepository} from '../../building/models';
import {OwnerRepository, PersonRepository} from '../../owner/models';
import {MigrateModelV2} from './migrate-model-v2';
import {OwnerType} from '../../types/enums';

async function createRelatedWorksheet(record, ownerRecords) {
  const idsToFind = ownerIds(ownerRecords);
  const {building, owners} = await Promise.props({
    building: findBuilding(record.buildingId),
    owners: findOwners(idsToFind)
  });

  if (idsToFind.length !== owners.length) {
    throw new Error(`Cannot find all owners with IDS [${idsToFind.join(', ')}]`);
  }
  await createPrincipalIfNeed(building, owners);
  await updateOwnersBuildings(idsToFind, building.id);
  await createWorksheet(building, owners);
}

function ownerIds(owners) {
  return _.chain(owners).filter('ownerId').map('ownerId').value();
}

async function findBuilding(migrateId) {
  const repo = new BuildingRepository();
  const qb = repo.getQueryBuilder().where('_migrateId = ?', migrateId);
  const [building] = await repo.query(qb);

  return building;
}

async function findOwners(ownerIds) {
  if (ownerIds.length === 0) return [];

  const repo = new OwnerRepository();
  const ids = arrayToQuery(ownerIds);
  const qb = repo.getQueryBuilder()
    .where(`t._migrateId IN ${ids}`);

  return repo.query(qb);
}

function arrayToQuery(values) {
  return `[${values.map(value => `'${value}'`).join(', ')}]`;
}

async function createPrincipalIfNeed(building, owners) {
  const principalOwner = _.find(owners, {name: building.owner.name, type: OwnerType.PRINCIPAL});

  if (principalOwner) return;

  const person = await findOrCreatePerson(building.owner);
  const owner = await createOwner(person, building);
  owners.push(owner);
}

async function createOwner(person, building) {
  const repo = new OwnerRepository();
  return repo.save({
    id: uuid(),
    person,
    buildingId: building.id,
    personId: person.id,
    _relatedTo: building.owner.name,
    name: building.owner.name,
    type: OwnerType.PRINCIPAL
  }, false);
}

async function findOrCreatePerson(owner) {
  const repo = new PersonRepository();
  const qb = repo.getQueryBuilder().where('name = ?', owner.name);
  const [person] = await repo.query(qb);

  return person || repo.save({name: owner.name, id: uuid()}, false);
}

async function updateOwnersBuildings(ownerIds, buildingId) {
  if (ownerIds.length === 0) return;

  const repo = new OwnerRepository();
  const ids = arrayToQuery(ownerIds);
  const qb = repo
    .getQueryBuilder('update')
    .set('buildingId = ?', buildingId)
    .where(`t._migrateId IN ${ids}`);

  return repo.query(qb);
}

async function createWorksheet(building, owners) {
  const repo = new WorksheetRepository();
  const worksheet = t.WorkSheet({
    id: uuid(),
    _relatedTo: building.owner.name,
    relatedBuildingIds: [building.id],
    relatedOwnerIds: _.map(owners, 'id'),
    buildingAddress: building.address
  });

  return repo.save(worksheet, false);
}

export class RelatedModel extends MigrateModelV2 {
  constructor(filename, app = {}) {
    super('related', filename, app);
    this.ownersCount = 0;
    this.buildings = 0;
    this.owners = [];
    this.lastRecord = null;
  }

  async run() {
    await super.run();
    console.log('owners', this.ownersCount, 'buildings', this.buildings);
  }

  async createWorksheet(record) {
    if (this.lastRecord === null) {
      this.lastRecord = record;
      this.owners = [record];
    }

    const ids = ownerIds(this.owners);
    console.log('creating worksheet for', this.lastRecord.buildingId, this.lastRecord.ownerName, 'with', ids.length, 'owners', ids);
    await createRelatedWorksheet(this.lastRecord, this.owners);
    this.setLastRecord(record); // keep different record for next batch
  }

  isSameBuilding(record) {
    if (this.lastRecord === null) {
      return false;
    }

    return this.lastRecord.buildingId === record.buildingId;
  }

  setLastRecord(record) {
    this.buildings++;
    this.ownersCount += this.owners.length;
    this.lastRecord = record;
    this.owners = [record];
  }

  addOwner(record) {
    if (this.lastRecord.ownerName !== record.ownerName) {
      throw new Error('adding wrong owner');
    }
    this.owners.push(record);
  }

  async pushToDatabase(record) {
    if (this.isSameBuilding(record)) {
      this.addOwner(record);
    } else {
      return this.createWorksheet(record);
    }
  }
}
