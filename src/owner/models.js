import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {updateList} from '../lib/tcomb-utils';
import {BuildingRepository} from '../building/models';
import isArray from 'lodash/isArray';

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

  async updateContactStatus(personId, body = {}) {
    const {id, data} = new t.UpdateContactStatus(body);
    const person = await this.findById(personId);
    const personContact = person.findContact({value: id});

    if (!personContact) {
      throw newHttpError(400, `La información de contacto ${id} no fue encontrada y no pudo actualizarse`);
    }

    const updatedContacts = updateList(person.contacts, personContact, data);
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

  async findByIdWithIncludes(id, includes = ['building', 'person']) {
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

    return this.query(qb);
  }

  async updateContactStatus(ownerId, contact) {
    const personRepo = new PersonRepository();
    const owner = await this.findByIdOrThrow(ownerId);

    return personRepo.updateContactStatus(owner.personId, contact);
  }

  async update(ownerId, data = {}) {
    const changes = t.OwnerUpdate(data);
    const owner = await this.findByIdOrThrow(ownerId);
    const updatedOwner = t.update(owner, {$merge: changes});

    return this.save(updatedOwner);
  }

  async addContact(ownerId, body) {
    const personRepo = new PersonRepository();
    const owner = await this.findByIdOrThrow(ownerId);

    return personRepo.addContact(owner.personId, body);
  }
}
