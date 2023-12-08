import { ContactProps, OwnerStatus, OwnerType } from '../owner'
import { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { DataSource, DeepPartial, EntityManager } from 'typeorm'
import { Owner } from '../owner.entity'
import { Person } from '../person.entity'
import { Contact } from '../../contacts/contact.entity'
import { PersonContact } from '../owner-contact.entity'
import { Logger } from 'winston'

export interface AddOwnerCommand {
  // verified: boolean,
  buildingId: string,
  status: OwnerStatus,
  type: OwnerType,
  note: string,
  person: {
    name: string,
    firstName: string,
    firstSurname: string,
    secondSurname?: string,
    contacts: ContactProps[]
  }
}

export class AddOwnerService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository,
    private ormDataSource: DataSource,
    private usePostgres: boolean,
    private logger: Logger
  ) {
  }

  addOwner (cmd: AddOwnerCommand): Promise<{ id: string }> {
    return this.usePostgres ? this.saveInPostgres(cmd) : this.couchbaseOwnersRepository.save(cmd)
  }

  private saveInPostgres (cmd: AddOwnerCommand): Promise<Owner> {
    return new Promise(async (resolve, reject) => {
      await this.ormDataSource.transaction(async (entityManager) => {
        try {
          resolve(await this.createEntities(cmd, entityManager))
        } catch (e) {
          this.logger.error('error saving owner', { error: e.message, command: cmd })
          reject(e)
        }
      })
    })
  }

  private async createEntities (cmd: AddOwnerCommand, entityManager: EntityManager) {
    const person: DeepPartial<Person> = {
      fullName: cmd.person.name,
      firstName: cmd.person.firstName,
      lastName: cmd.person.firstSurname,
    }
    const savedPerson = await entityManager.save<Person>(person as Person)
    const { contacts } = cmd.person
    for (const c of contacts) {
      const savedContact = await entityManager.save<Contact>({
        value: c.value,
        type: c.type
      } as Contact)
      await entityManager.save<PersonContact>({
        owner: savedPerson,
        contact: savedContact,
        status: c.status,
      } as PersonContact)
    }

    return await entityManager.save<Owner>({
      person: savedPerson,
      building: { id: cmd.buildingId },
      status: cmd.status
    } as Owner)
  }
}
