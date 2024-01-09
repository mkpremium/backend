import { ContactProps, OwnerStatus, OwnerType } from '../owner'
import { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { DataSource, EntityManager } from 'typeorm'
import { Owner } from '../owner.entity'
import { Contact } from '../../contacts/contact.entity'
import { PersonContact } from '../person-contact.entity'
import { createOwner } from './create-owner'
import { EventBus } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { Logger } from 'winston'
import _ from 'lodash'

export interface AddOwnerCommand {
  id?: string,
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
    private logger: Logger,
  ) {
  }

  addOwner (cmd: AddOwnerCommand, requesterId: string): Promise<{ id: string }> {
    return this.usePostgres ? this.saveInPostgres(cmd, requesterId) : this.couchbaseOwnersRepository.save(cmd)
  }

  private async saveInPostgres (cmd: AddOwnerCommand, requesterId: string): Promise<Owner> {
    return await this.ormDataSource.transaction<Owner>(async em => {
      const owner = await this.createEntities(cmd, em)
      await this.eventBus.publish({
        name: DomainEventCatalog.OWNER__ADDED,
        version: '1',
        addedBy: requesterId,
        ownerId: owner.id,
        note: cmd.note,
      }, em)

      return owner
    })

  }

  private async createEntities (cmd: AddOwnerCommand, entityManager: EntityManager) {
    const [ savedOwner, savedPerson ] = await createOwner(entityManager, cmd)

    const { contacts } = cmd.person
    if (_.uniqBy(contacts, 'value').length !== contacts.length) {
      console.error('Owner with duplicated contacts', { ownerId: savedOwner.id, cmd })
    }

    for (const c of contacts) {
      let contact = await entityManager.findOneBy(Contact, { value: c.value })
      if (!contact) {
        this.logger.info('Creating contact', { value: c.value })
        contact = await entityManager.save(Contact, {
          value: c.value,
          type: c.type
        })
      }

      await entityManager.save(PersonContact, {
        contact,
        person: savedPerson,
        status: c.status,
      })
    }

    return savedOwner as Owner
  }
}
