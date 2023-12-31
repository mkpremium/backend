import { ContactProps, OwnerStatus, OwnerType } from '../owner'
import { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { DataSource, EntityManager } from 'typeorm'
import { Owner } from '../owner.entity'
import { Contact } from '../../contacts/contact.entity'
import { PersonContact } from '../person-contact.entity'
import { createOwner } from './create-owner'
import { EventBus } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

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
    contacts: Omit<ContactProps, 'id'>[]
  }
}

export class AddOwnerService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository,
    private ormDataSource: DataSource,
    private usePostgres: boolean,
    private eventBus: EventBus,
  ) {
  }

  addOwner (cmd: AddOwnerCommand, requesterId: string): Promise<{ id: string }> {
    return this.usePostgres ? this.saveInPostgres(cmd, requesterId) : this.couchbaseOwnersRepository.save(cmd)
  }

  private async saveInPostgres (cmd: AddOwnerCommand, requesterId: string): Promise<Owner> {
    const owner = await new Promise(async (resolve) => {
      await this.ormDataSource.transaction(async (entityManager) => {
        resolve(await this.createEntities(cmd, entityManager))
      })
    }) as Owner

    await this.eventBus.publish({
      name: DomainEventCatalog.OWNER__ADDED,
      version: '1',
      addedBy: requesterId,
      ownerId: owner.id,
      note: cmd.note,
    })
    return owner
  }

  private async createEntities (cmd: AddOwnerCommand, entityManager: EntityManager) {
    const [ savedOwner, savedPerson ] = await createOwner(entityManager, cmd)

    const { contacts } = cmd.person
    for (const c of contacts) {
      // TODO: Handle duplicated contact case.
      // TODO: save command note
      const savedContact = await entityManager.save(Contact, {
        value: c.value,
        type: c.type
      })
      await entityManager.save(PersonContact, {
        person: savedPerson,
        contact: savedContact,
        status: c.status,
      })
    }

    return savedOwner as Owner
  }
}
