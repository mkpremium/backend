import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {updateList} from '../lib/tcomb-utils';

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

  async updateContactStatus(personId, contact) {
    const updatedContact = new t.TypedContactInfoUpdate(contact);
    const person = await this.findById(personId);
    const personContact = person.findContact(updatedContact);

    if (!personContact) {
      throw newHttpError(400, `La información de contacto ${updatedContact.value} no fue encontrada y no pudo actualizarse`);
    }

    const updatedContacts = updateList(person.contacts, personContact, updatedContact);
    const updatedPerson = t.update(person, {contacts: {$set: updatedContacts}});

    return this.save(updatedPerson);
  }
}

export class OwnerRepository extends Owner {
  async updateContactStatus(ownerId, contact) {
    const personRepo = new PersonRepository();
    const owner = await this.findById(ownerId);

    if (!owner) {
      throw newHttpError(404, `El owner ${ownerId} no existe`);
    }

    return personRepo.updateContactStatus(owner.personId, contact);
  }
}
