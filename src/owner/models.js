import t from 'tcomb';
import _head from 'lodash/head';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {updateList} from '../lib/tcomb-utils';
import {BuildingRepository} from '../building/models';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';

export class Owner extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Owner;
  }
}

export class Person extends CouchbaseModel {

}

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

    const updatedContacts = t.update(person.contacts, {$push: [newContact]});
    const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}});

    return this.save(updatedPerson);
  }
}

export class OwnerRepository extends Owner {
  async findByIdOrThrow(ownerId) {
    const owner = await this.findById(ownerId);
    if (!owner) {
      throw newHttpError(404, `El propietario ${ownerId} no existe`);
    }

    return owner;
  }

  // TODO: .map() should not be used for convert owner.person in object
  async findByIdWithIncludes(id, includes = ['person']) {
    if (!id) {
      throw new Error('id undefined, expected String or Array<String>');
    }

    const ids = isArray(id) ? id : [id];
    const idsText = `[${ids.map(id => `'${id}'`).join(', ')}]`;
    const qb = this.getQueryBuilder('let').where(`id IN ${idsText}`);

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

    const result = await this.query(qb);

    return result.map((owner) => Object.assign({}, owner, {
      person: _head(owner.person || []),
      building: _head(owner.building || [])
    }));
  }

  async updateContact(ownerId, contactId, data) {
    const {personId} = await this.findByIdOrThrow(ownerId);
    const personRepo = new PersonRepository();
    return personRepo.updateContact(personId, contactId, data);
  }

  async createOwnerAndPerson(body) {
    const ownerBody = t.OwnerBody(body);

    if (!isEmpty(ownerBody.person)) {
      const personRepo = new PersonRepository();
      const person = await personRepo.save(ownerBody.person);
      body.personId = person.id;
      delete body.person;
    }

    return this.save(body);
  }

  async update(ownerId, data = {}) {
    const owner = await this.findByIdOrThrow(ownerId);
    const updatedOwner = t.update(owner, {$merge: data});

    return this.save(updatedOwner);
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
}
