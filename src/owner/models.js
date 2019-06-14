import {N1qlQuery} from 'couchbase';
import t from 'tcomb';
import _head from 'lodash/head';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {updateList} from '../lib/tcomb-utils';
import {BuildingRepository} from '../building/models';
import {WorksheetRepository} from '../worksheet/models/worksheet';
import {OwnerBusinessStatus, OwnerStatus} from '../types/enums';
import _ from 'lodash';
import {saveBuildingOwnerToFirebase} from '../firebase/lib/business';
import fromJSON from 'tcomb/lib/fromJSON';
import {OwnerListQuery} from './types';
import squel from 'squel/dist/squel';
import {Owner} from '../types/owner';

export class Person extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Person;
  }
}

export const ContactStatus = {
  UNDEFINED: 'UNDEFINED',
  GOOD: 'GOOD',
  BAD: 'BAD'
};

export class PersonRepository extends Person {
  constructor() {
    super();
    this.Struct = t.Person;
  }

  async searchPeople(query) {
    const params = t.PeopleSearchQuery(query);
    const qs = this.getSearchBuilder(params.query);
    qs.highlight();
    qs.fields('*');

    return this.search(qs);
  }

  async findByIdOrThrow(personId) {
    const person = await this.findById(personId);
    if (!person) {
      throw newHttpError(404, `La persona ${personId} no existe`);
    }

    return person;
  }

  async updateContact(personId, contactId, data) {
    const person = await this.findByIdOrThrow(personId);
    const contact = person.findContactById(contactId);
    if (!contact) {
      throw newHttpError(400, `La información de contacto ${contactId} no fue encontrada y no pudo actualizarse`);
    }

    const updatedContacts = updateList(person.contacts, contact, Object.assign({}, data, {id: contactId}));
    const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}});

    return this.save(updatedPerson);
  }

  async addContact(personId, body = {}) {
    const newContact = new t.TypedContactInfo(body);
    const person = await this.findById(personId);

    if (!person) {
      throw newHttpError(400, `La persona ${personId} asociada al propietario no pudo ser encontrada`);
    }

    if (person.contactValueExists(newContact.value)) {
      throw newHttpError(400, `La persona ${personId} asociada al propietario ya tiene un contacto con el mismo valor`);
    }

    const updatedContacts = t.update(person.contacts, {$push: [newContact]});
    const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}});

    return this.save(updatedPerson);
  }

  /**
   * Find person by dni / document number
   * @param documentNumber
   * @param required
   * @returns {Promise<void>}
   */
  async findByDocumentNumber(documentNumber, required = true) {
    const expr = squel.expr().and('t.documentNumber = ?', documentNumber);
    const qb = this.getQueryBuilder()
      .where(expr);
    const results = await this.query(qb);

    if (required && (!results || results.length === 0)) {
      throw new Error(`No records of ${this._getMeta().defaultProps._documentType} found by documentNumber: ${documentNumber}`);
    }

    return _head(results);
  }

  /**
   * Find person migrateOwnerId
   * @param migrateOwnerId
   * @param required
   * @returns {Promise<void>}
   */
  async findByMigrateOwnerId(migrateOwnerId, required = true) {
    const expr = squel.expr().and('t._migrateOwnerId = ?', migrateOwnerId);
    const qb = this.getQueryBuilder()
      .where(expr);
    const results = await this.query(qb);

    if (required && (!results || results.length === 0)) {
      throw new Error(`No records of ${this._getMeta().defaultProps._documentType} found by _migrateOwnerId: ${migrateOwnerId}`);
    }

    return _head(results);
  }
}

function ownerIncludes(qb, includes) {
  if (includes.indexOf('building') !== -1) {
    const buildingRepo = new BuildingRepository();
    const letBuildingQuery = buildingRepo
      .getQueryBuilder('use', 'b')
      .useKey('t.`buildingId`')
      .where('t.`buildingId` = b.`id`');
    qb
      .letQuery('building', letBuildingQuery)
      .field('building');
  }

  if (includes.indexOf('person') !== -1) {
    const personRepo = new PersonRepository();
    const letPersonQuery = personRepo
      .getQueryBuilder('use', 'p')
      .useKey('t.`personId`')
      .where('t.`personId` = p.`id`');
    qb
      .letQuery('person', letPersonQuery)
      .field('person');
  }
}

function mapOwnerIncludes(owner) {
  return Object.assign({}, owner, {
    person: _head(owner.person || []),
    building: _head(owner.building || [])
  });
}

const OwnerStatsParams = t.struct({
  city: t.maybe(t.String)
});

const OwnerBusinessStatsParams = t.struct({
  operatorId: t.maybe(t.String)
});

export class OwnerRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Owner;
  }

  async findByIdOrThrow(ownerId) {
    const owner = await this.findById(ownerId);
    if (!owner) {
      throw newHttpError(404, `El propietario ${ownerId} no existe`);
    }

    return owner;
  }

  /**
   *
   * @param {*} data
   * @return {Promise<t.Owner>}
   */
  static async validateOwner(data) {
    const owner = fromJSON(data, t.OwnerWithInclude);
    const ownerRepo = new OwnerRepository();
    const updatedOwner = owner.calculateOwnerValidStatus();
    if (updatedOwner.status !== owner.status) {
      return ownerRepo.save(updatedOwner, false);
    }

    return Promise.resolve(owner);
  }

  async findByMigratedId(migratedId) {
    const owners = await super.findByMigratedId(migratedId);
    if (owners.length === 0) {
      throw new Error(`Cannot find owner by ${migratedId}`);
    }

    return fromJSON(owners[0], this.Struct);
  }

  async findByBuildingWithIncludes(buildingId, includes = ['person', 'building']) {
    const qb = this.getQueryBuilder('let').where('buildingId = ?', buildingId);
    ownerIncludes(qb, includes);
    const result = await this.query(qb);
    return result.map(mapOwnerIncludes);
  }

  // TODO: .map() should not be used for convert owner.person in object
  async findByIdWithIncludes(id, includes = ['person']) {
    if (!id) {
      // noinspection HtmlUnknownTag
      throw new Error('id undefined, expected String or Array<String>');
    }

    const ids = _isArray(id) ? id : [id];
    const idsText = `[${ids.map(id => `'${id}'`).join(', ')}]`;
    const qb = this.getQueryBuilder('let').where(`id IN ${idsText}`);

    ownerIncludes(qb, includes);
    const result = await this.query(qb);

    return result.map(mapOwnerIncludes);
  }

  async updateContact(ownerId, contactId, data) {
    const owner = await this.findByIdOrThrow(ownerId);
    const personRepo = new PersonRepository();
    return personRepo.updateContact(owner.personId, contactId, data);
  }

  async createOwnerAndPerson(body) {
    const ownerBody = t.OwnerBody(body);
    const personRepo = new PersonRepository();
    const buildingRepository = new BuildingRepository();
    const buildingId = ownerBody.buildingId;
    let building;

    if (buildingId) {
      building = await buildingRepository.findByIdOrThrow(buildingId);
    }

    const person = _isEmpty(ownerBody.person)
      ? await personRepo.findByIdOrThrow(ownerBody.personId)
      : await personRepo.save(ownerBody.person);

    body.personId = person.id;
    body.name = person.fullName();
    delete body.person;

    const owner = await this.save(body);

    if (building) {
      const worksheetRepository = new WorksheetRepository();
      const worksheet = await worksheetRepository.findWorksheetByBuilding(buildingId);
      await worksheetRepository.addOnlyOwner(worksheet, owner);
    }

    return owner;
  }

  async update(ownerId, data = {}, operatorId) {
    const owner = await this.findByIdOrThrow(ownerId);
    let updatedOwner = t.update(owner, {$merge: Object.assign({}, data, {id: ownerId})});

    if (typeof data.verified !== 'undefined') {
      const owner = t.Owner(updatedOwner);
      updatedOwner = owner.verifyOwner(operatorId, data.verified);
    }

    return this.save(updatedOwner);
  }

  async initialBusinessStatus(ownerId, meetingWithOperatorId) {
    const owner = await this.findByIdOrThrow(ownerId);
    if (!owner.business) {
      const business = {
        status: OwnerBusinessStatus.PENDING,
        meetingWithOperatorId
      };
      const updatedOwner = t.update(owner, {business: {$set: business}});
      return this.save(updatedOwner, false);
    }
  }

  async updateBusinessStatusFirebase(ownerId, status, updatedBy) {
    const owner = await this.updateBusinessStatus(ownerId, status, updatedBy);
    const [updatedOwner] = await this.findByIdWithIncludes(ownerId, ['building', 'person']);
    await saveBuildingOwnerToFirebase(updatedOwner);
    await OwnerRepository.recalculateWorksheetStatus(updatedOwner);
    return owner;
  }

  static async recalculateWorksheetStatus(owner) {
    const repo = new WorksheetRepository();
    const worksheet = await WorksheetRepository.findByBuilding(owner.buildingId);
    return repo.updateStatus(worksheet.id);
  }

  async updateBusinessStatus(ownerId, status, updatedBy) {
    const owner = await this.findByIdOrThrow(ownerId);

    const update = $set => {
      const updatedOwner = t.update(owner, {business: {$set}});
      return this.save(updatedOwner);
    };

    if (owner.business) {
      const updatedBusiness = t.update(owner.business, {status: {$set: status}});
      return update(updatedBusiness);
    } else {
      // no definido antes? no cita?
      const business = {
        status,
        meetingWithOperatorId: updatedBy
      };
      return update(business);
    }
  }

  async addContact(ownerId, body) {
    const personRepo = new PersonRepository();
    const owner = await this.findByIdOrThrow(ownerId);

    return personRepo.addContact(owner.personId, body);
  }

  async getContactPhoneNumber(ownerId, contactId) {
    const personRepo = new PersonRepository();
    const owner = await this.findById(ownerId);
    const person = await personRepo.findById(owner.personId);

    const ownerContactValue = person.findContactById(contactId);

    if (!ownerContactValue) {
      throw newHttpError(400, `El número de contacto para el owner ${ownerId} no existe`);
    }

    return ownerContactValue;
  }

  async ownerStats(args = {}) {
    const params = OwnerStatsParams(args);
    const bucket = this.getBucketName();
    const query = _isNil(params.city)
      ? `SELECT t.status, COUNT(*) as count FROM ${bucket} \`t\`
WHERE t.\`_documentType\` = 'owner'
GROUP BY t.status`
      : `SELECT t.status, building[0].address.city, COUNT(*) as count FROM ${bucket} \`t\`
LET building = (SELECT RAW p FROM ${bucket} \`p\` USE KEYS t.buildingId  WHERE id = t.buildingId LIMIT 1)
WHERE t.\`_documentType\` = 'owner' AND t.buildingId IS NOT MISSING
AND LOWER(building[0].address.city) = LOWER('${params.city}')
GROUP BY t.status, building[0].address.city`;
    const result = await this.queryRaw(N1qlQuery.fromString(query));

    const totals = {};

    Object.values(OwnerStatus).forEach(status => {
      let total = 0;
      _.filter(result, {status}).forEach(({count}) => {
        total += count;
      });
      totals[status] = total;
    });

    return totals;
  }

  async ownerBusinessStats(args = {}) {
    const params = OwnerBusinessStatsParams(args);
    const bucket = this.getBucketName();
    const query = _isNil(params.operatorId)
      ? `SELECT t.business.status, COUNT(*) as count
FROM ${bucket} \`t\`
WHERE t.\`_documentType\` = 'owner' AND t.business.status IS NOT MISSING
GROUP BY t.business.status`
      : `SELECT t.business.status, COUNT(*) as count
FROM ${bucket} \`t\`
WHERE t.\`_documentType\` = 'owner' AND t.business.status IS NOT MISSING
AND t.business.meetingWithOperatorId = '${params.operatorId}'
GROUP BY t.business.status`;
    const result = await this.queryRaw(N1qlQuery.fromString(query));
    const totals = {};

    Object.values(OwnerBusinessStatus).forEach(status => {
      let total = 0;
      _.filter(result, {status}).forEach(({count}) => {
        total += count;
      });
      totals[status] = total;
    });

    return totals;
  }

  async list(query = {}) {
    const params = new OwnerListQuery(query);
    let results = [];

    if (params.contactNumber) {
      const personRepository = new PersonRepository();
      const qbPerson = personRepository.getQueryBuilder('select')
        .limit(params.limit)
        .where('ANY v IN contacts SATISFIES `v`.`value` = ? END', params.contactNumber);
      const personResults = await personRepository.query(qbPerson);
      const personIds = _.uniq(_.map(personResults, 'id'));

      if (personIds && personIds.length) {
        const qbOwners = this.getQueryBuilder('let')
          .limit(params.limit)
          .where(`personId IN ${JSON.stringify(personIds)}`);

        ownerIncludes(qbOwners, ['person']);
        const result = await this.query(qbOwners);
        results = result.map(mapOwnerIncludes);
      }
    }

    return fromJSON({results}, t.OwnerLitResponse);
  }

  async findByPersonId(personId) {
    const qb = this.getQueryBuilder().where('t.`personId` = ?', personId);
    const results = await this.query(qb);
    return results && results.length && _.first(results);
  }

  /**
   *
   * @param buildingId - the building id
   * @param ownerStatus - owner status
   * @returns {Promise<*>}
   */
  async findAllByBuildingId(buildingId, ownerStatus) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ?', buildingId)
      .where('t.`status` = ?', ownerStatus);

    const results = await this.query(qb);
    const ownerIds = _.map(results, 'id');
    return this.findByIdWithIncludes(ownerIds, ['person', 'building']);
  }

  async findOwnersByBuildingId(buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ?', buildingId)
    const results = await this.query(qb);

    if (!results || results.length === 0) {
      return [];
    }

    const ownerIds = _.map(results, 'id');

    const qbOwners = this.getQueryBuilder().where(`id IN ${JSON.stringify(ownerIds)}`);
    const resultOwners = await this.query(qbOwners);

    return resultOwners.map(owner => fromJSON(owner, Owner));
  }
}
