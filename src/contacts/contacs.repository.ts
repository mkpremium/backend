import { WithPostgresRepository } from '../infrastructure/postgres/postgres-repository'
import { Contact } from './contact.entity'

export class ContactsRepository extends WithPostgresRepository<Contact> {
  protected target = Contact
  save (c: Contact) {
    return this.repository.save(c)
  }
}
