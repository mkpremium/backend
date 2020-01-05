import uuid from 'uuid/v4'
import t from 'tcomb'
import Promise from 'bluebird'
import _ from 'lodash'

import { WorksheetRepository } from '../../worksheet/models/worksheet'
import { BuildingRepository } from '../../building/models'
import { OwnerRepository, PersonRepository } from '../../owner/models'
import { MigrateModelV2 } from './migrate-model-v2'
import { OwnerType } from '../../types/enums'

async function createRelatedWorksheet (record, ownerRecords) {
  const idsToFind = ownerIds(ownerRecords)
  const { building, owners } = await Promise.props({
    building: findBuilding(record.buildingId),
    owners: findOwners(idsToFind)
  })

  if (idsToFind.length !== owners.length) {
    throw new Error(`Cannot find all owners with IDS [${idsToFind.join(', ')}]`)
  }
  await createPrincipalIfNeed(building, owners)
  await updateOwnersBuildings(idsToFind, building.id)
  await createRelatedOwners(building, owners)
  await createWorksheet(building, owners)
}

function ownerIds (owners) {
  return _.chain(owners).filter('ownerId').map('ownerId').value()
}

async function findBuilding (migrateId) {
  const repo = new BuildingRepository()
  const qb = repo.getQueryBuilder().where('_migrateId = ?', migrateId)
  const [building] = await repo.query(qb)

  return building
}

async function findOwners (ownerIds) {
  if (ownerIds.length === 0) return []

  const repo = new OwnerRepository()
  const ids = arrayToQuery(ownerIds)
  const qb = repo.getQueryBuilder()
    .where(`t._migrateId IN ${ids}`)

  return repo.query(qb)
}

function arrayToQuery (values) {
  return `[${values.map(value => `'${value}'`).join(', ')}]`
}

async function createPrincipalIfNeed (building, owners) {
  const principalOwner = _.find(owners, { name: building.owner.name, type: OwnerType.PRINCIPAL })

  if (principalOwner) return

  const owner = await findOrCreateOwner(building)
  owners.push(owner)
}

async function findOrCreateOwner (building) {
  console.log('adding principal to', building.buildingId, building.owner.name)

  const owner = await findOwner(building)
  if (owner) {
    return addBuildingIdToOwner(owner, building)
  }

  const person = await findOrCreatePerson(building.owner)
  return createOwner(person, building, OwnerType.PRINCIPAL)
}

async function addBuildingIdToOwner (owner, building) {
  const repo = new OwnerRepository()
  const updatedOwner = t.update(owner, { buildingId: { $set: building.id } })

  await repo.save(updatedOwner, false)
  return owner
}

async function findOwner (building) {
  const repo = new OwnerRepository()
  const qb = repo.getQueryBuilder()
    .where('name = ?', building.owner.name)
  const [owner] = await repo.query(qb)

  return owner
}

async function createOwner (person, building, type) {
  const repo = new OwnerRepository()
  return repo.save({
    id: uuid(),
    person,
    buildingId: building.id,
    personId: person.id,
    _relatedTo: building.owner.name,
    name: person.name,
    type
  }, false)
}

async function findOrCreatePerson (owner) {
  const repo = new PersonRepository()
  const qb = repo.getQueryBuilder().where('name = ?', owner.name)
  const [person] = await repo.query(qb)

  return person || repo.save({ name: owner.name, id: uuid() }, false)
}

async function findMigratePerson (owner) {
  const repo = new PersonRepository()
  const qb = repo.getQueryBuilder()
    .where('_migrateId IS NOT MISSING')
    .where('name = ?', owner.name)
  const people = await repo.query(qb)

  // return just person that have all the info to work with
  function goodOne (person) {
    return person.birthYear !== 0 &&
      !_.isEmpty(person.firstSurname) &&
      !_.isEmpty(person.secondSurname)
  }

  console.log('findMigratePerson ', owner.name, 'found', people.length)

  return _.find(people, goodOne)
}

async function updateOwnersBuildings (ownerIds, buildingId) {
  if (ownerIds.length === 0) return

  const repo = new OwnerRepository()
  const ids = arrayToQuery(ownerIds)
  const qb = repo
    .getQueryBuilder('update')
    .set('buildingId = ?', buildingId)
    .where(`t._migrateId IN ${ids}`)

  return repo.query(qb)
}

async function createWorksheet (building, owners) {
  const repo = new WorksheetRepository()
  const worksheet = t.WorkSheet({
    id: uuid(),
    _relatedTo: building.owner.name,
    relatedBuildingIds: [building.id],
    relatedOwnerIds: _.map(owners, 'id'),
    buildingAddress: building.address
  })

  return repo.save(worksheet, false)
}

async function createRelatedOwners (building, owners) {
  const { family, related, neighbors } = await findByRelatedPeople(building)

  async function createRelated (relatedPeople, type) {
    if (relatedPeople.length === 0) {
      return []
    }
    return Promise.map(relatedPeople, (person) => createOwner(person, building, type))
  }

  const familyOwners = await createRelated(family, OwnerType.FAMILY)
  const relatedOwners = await createRelated(related, OwnerType.RELATED)
  const neighborsOwners = await createRelated(neighbors, OwnerType.NEIGHBOUR)

  const newOwners = familyOwners.concat(relatedOwners).concat(neighborsOwners)

  if (newOwners.length > 0) {
    const ids = _.map(newOwners, 'id')
    console.log('adding extra owners', building._migrateId, building.owner.name, ids)
  }

  newOwners.forEach(related => {
    owners.push(related)
  })
}

async function findByRelatedPeople (building) {
  const person = await findMigratePerson(building.owner)
  if (!person) {
    return {
      family: [],
      related: [],
      neighbors: []
    }
  }
  // hermanos
  const related = await findPeopleByFamilyName(person)
  // familia misma casa
  const family = await findPeopleInSameHouse(person)
  // neighborhood same building
  const neighbors = await findPeopleSameBuilding(building)

  return {
    family,
    related,
    neighbors
  }
}

async function findPeopleByFamilyName (person) {
  if (person.birthYear === 0 || _.isEmpty(person.firstSurname) || _.isEmpty(person.secondSurname)) {
    return []
  }

  const ageStart = person.birthYear - 10
  const ageEnd = person.birthYear + 10

  const repo = new PersonRepository()
  const qb = repo.getQueryBuilder()
    .where('t.birthYear >= ?', ageStart)
    .where('t.birthYear <= ?', ageEnd)
    .where('LOWER(t.firstSurname) = LOWER(?)', person.firstSurname)
    .where('LOWER(t.secondSurname) = LOWER(?)', person.secondSurname)
    .limit(10)

  return repo.query(qb)
}

async function findPeopleInSameHouse (person) {
  const [address] = person.addresses
  if (!address) return []

  const floor = _.get(address, 'floor', '') || ''
  const number = _.get(address, 'number', '') || ''
  const addressLocation = floor + number

  if (_.isEmpty(address.fullAddress) || _.isEmpty(address.postalCode) || _.isEmpty(addressLocation)) {
    return []
  }

  const repo = new PersonRepository()
  const qb = repo.getQueryBuilder()
    .where('t._address IS NOT MISSING')
    .where('t._address.fullAddress = ?', address.fullAddress)
    .where('t._address.postalCode = ?', address.postalCode.number)

  if (!_.isEmpty(floor)) {
    qb.where('t._address.floor = ?', floor)
  }
  if (!_.isEmpty(number)) {
    qb.where('t._address.`number` = ?', number)
  }

  qb.limit(10)

  return repo.query(qb)
}

async function findPeopleSameBuilding (building) {
  const fullAddress = _.get(building, 'address.fullAddress', '') || ''
  const postalCode = _.get(building, 'address.postalCode', '') || ''

  if (_.isEmpty(fullAddress) || _.isEmpty(postalCode)) {
    return []
  }

  const repo = new PersonRepository()
  const qb = repo.getQueryBuilder()
    .where('t._address.fullAddress = ?', fullAddress)
    .where('t._address.postalCode = ?', postalCode)
    .limit(10)

  return repo.query(qb)
}

export class RelatedModel extends MigrateModelV2 {
  constructor (filename, app = {}) {
    super('related', filename, app)
    this.ownersCount = 0
    this.buildings = 0
    this.owners = []
    this.lastRecord = null
  }

  async run () {
    await super.run()
    console.log('owners', this.ownersCount, 'buildings', this.buildings)
  }

  async createWorksheet (record) {
    if (this.lastRecord === null) {
      this.lastRecord = record
      this.owners = [record]
    }

    const ids = ownerIds(this.owners)
    console.log('creating worksheet for', this.lastRecord.buildingId, this.lastRecord.ownerName, 'with', ids.length, 'owners', ids)
    await createRelatedWorksheet(this.lastRecord, this.owners)
    this.setLastRecord(record) // keep different record for next batch
  }

  isSameBuilding (record) {
    if (this.lastRecord === null) {
      return false
    }

    return this.lastRecord.buildingId === record.buildingId
  }

  setLastRecord (record) {
    this.buildings++
    this.ownersCount += this.owners.length
    this.lastRecord = record
    this.owners = [record]
  }

  addOwner (record) {
    if (this.lastRecord.ownerName !== record.ownerName) {
      throw new Error('adding wrong owner')
    }
    this.owners.push(record)
  }

  async pushToDatabase (record) {
    if (this.isSameBuilding(record)) {
      this.addOwner(record)
    } else {
      return this.createWorksheet(record)
    }
  }
}
