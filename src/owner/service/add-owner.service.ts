import { ContactProps, OwnerContactStatus, OwnerProps, OwnerStatus, OwnerType } from '../owner'
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
import { PostgresOwnersRepository } from '../repository/postgres-owners.repository'
import { Person } from '../person.entity'

export interface AddOwnerCommand {
  id?: string,
  // verified: boolean,
  buildingId: string,
  status: OwnerStatus,
  type: OwnerType,
  note: string,
  featuredContact?: {
    phoneId?: string;
    emailId?: string;
  }
  person: {
    name: string,
    firstName: string,
    firstSurname: string,
    secondSurname?: string,
    contacts: (Omit<ContactProps, 'id'> & {id?: string})[]
  }
}

export class AddOwnerService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository,
    private postgresOwnersRepository: PostgresOwnersRepository,
    private ormDataSource: DataSource,
    private usePostgres: boolean,
    private eventBus: EventBus,
    private logger: Logger
  ) {
  }

  addOwner (cmd: AddOwnerCommand, requesterId: string): Promise<OwnerProps> {
    return this.usePostgres ? this.saveInPostgres(cmd, requesterId) : this.couchbaseOwnersRepository.save(cmd)
  }

  private async saveInPostgres (cmd: AddOwnerCommand, requesterId: string): Promise<OwnerProps> {
    const savedOwner = await this.ormDataSource.transaction<Owner>(async em => {
      const owner = await this.createEntities(cmd, em)
      await this.eventBus.publish({
        name: DomainEventCatalog.OWNER__ADDED,
        version: '1',
        addedBy: requesterId,
        ownerId: owner.id,
        note: cmd.note
      }, em)

      return owner
    })

    // Return the owner with the same structure as the one in Couchbase
    return this.postgresOwnersRepository.get(savedOwner.id)
  }

  private async createEntities (cmd: AddOwnerCommand, entityManager: EntityManager) {
    const [savedOwner, savedPerson] = await createOwner(entityManager, cmd)

    const { contacts } = cmd.person
    if (_.uniqBy(contacts, 'value').length !== contacts.length) {
      this.logger.error('Owner with duplicated contacts', { ownerId: savedOwner.id, cmd })
    }

    const contactsByValue = _.groupBy(contacts, 'value')
    const consolidatedContacts = Object.keys(contactsByValue).map(value => {
      const statuses = _.uniq(contactsByValue[value].map(({ status }) => status))

      // Return the first contact from the array of contacts with the current value.
      // This effectively removes any duplicate contacts with the same value,
      // leaving only one contact per unique value.
      const contact = contactsByValue[value][0]
      // If there is more than one status for the contacts with the current value, log an error.
      // This indicates that there are contacts with the same value but different statuses.
      if (statuses.length !== 1) {
        contact.status = conflictContactStatusPolicy(statuses)
        this.logger.warning('Owner with contact in different statuses', {
          id: savedOwner,
          value,
          statuses,
          resolvedStatus: contact.status
        })
      }

      return {
        ...{ ...contactsByValue[value][0], status: conflictContactStatusPolicy(statuses) },
        isFeatured: contactsByValue[value].find(
          ({ id }) => [cmd.featuredContact?.emailId, cmd.featuredContact?.phoneId].includes(id))
      }
    })

    for (const c of consolidatedContacts) {
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
        status: c.status
      })
      if (c.isFeatured) {
        if (['TELEFONO', 'MOVIL'].includes(c.type)) {
          await entityManager.save(Person, {
            ...savedPerson,
            featuredPhoneContact: { id: contact.id }
          })
        } else {
          await entityManager.save(Person, {
            ...savedPerson,
            featuredEmailContact: { id: contact.id }
          })
        }
      }
    }

    return savedOwner as Owner
  }
}

export function conflictContactStatusPolicy (statuses: OwnerContactStatus[]) {
  if (statuses.length === 2) {
    if (statuses[0] === 'UNDEFINED') {
      return statuses[1]
    }
    if (statuses[1] === 'UNDEFINED') {
      return statuses[0]
    }
  }
  if (statuses.length === 1) {
    return statuses[0]
  }

  return 'UNDEFINED'
}
