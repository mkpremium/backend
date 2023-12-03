import { EntityTarget } from 'typeorm'
import { WithPostgresRepository } from '../infrastructure/postgres/postgres-repository'
import { Contact } from './contact.entity'

export class ContactsRepository extends WithPostgresRepository<Contact> {
  save (c: Contact) {
    return this.repository.save(c)
  }

  protected getEntityTarget (): EntityTarget<Contact> {
    return Contact
  }
}
