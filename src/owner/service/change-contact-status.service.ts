import { EventPublisher } from '../../infrastructure/event-bus'
import { OwnerRepository } from '../repository/owner.repository'
import { changeContactStatus, OwnerProps, OwnerStatus } from '../owner'
import { Logger } from 'winston'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { Owner } from '../owner.entity'
import { PersonContact } from '../person-contact.entity'
import _ from 'lodash'
import { ownerEntityToStruct } from '../repository/postgres-owners.repository'

export interface OwnerStatusChangedEvent {
  name: DomainEventCatalog.OWNER__STATUS_CHANGED;
  ownerId: string;
  buildingId: string;
  oldStatus: OwnerStatus;
  newStatus: OwnerStatus;
  byUserId: string;
}

export interface OwnerContactStatusChanged {
  name: DomainEventCatalog.OWNER__CONTACT_STATUS_CHANGED
  ownerId: string
  contactId: string
  newContactStatus: 'GOOD' | 'BAD' | 'UNDEFINED'
}

export class ChangeContactStatusService {
  constructor (
    private ownersRepository: OwnerRepository,
    private eventBus: EventPublisher,
    private logger: Logger,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async change ({ ownerId, contactId, status }, user): Promise<OwnerProps> {
    return this.usePostgres
      ? this.doPostgres({ ownerId, contactId, status }, user)
      : this.doCouchbase({
        ownerId,
        contactId,
        status
      }, user)
  }

  private async doPostgres ({ ownerId, contactId, status }, user): Promise<OwnerProps> {
    return this.entityManager.transaction<OwnerProps>(async (em) => {
      const owner = await em.findOne(Owner, {
        where: { id: ownerId },
        relations: {
          person: {
            contacts: {
              contact: true
            }
          },
          building: true
        }
      })
      const personContact = owner.person.contacts.find(pc => pc.contact.id === contactId)!
      personContact.status = status
      await em.save(PersonContact, personContact)
      const restPersonContacts = owner.person.contacts.filter(pc => pc.contact.id !== contactId)

      const oldStatus = owner.status
      if (status === 'BAD' && _.every(restPersonContacts, pc => pc.status === 'BAD')) {
        owner.status = 'WITHOUT_CONTACT'
        await em.save(Owner, owner)
      } else if (status === 'GOOD' || _.some(restPersonContacts, pc => pc.status === 'GOOD')) {
        owner.status = 'VERIFICADO'
        await em.save(Owner, owner)
      }

      await this.publishEvents({
        ownerId,
        contactId,
        newContactStatus: status,
        owner: { buildingId: owner.building.id, status: oldStatus },
        updatedOwner: owner,
        em,
        byUserId: user.id
      })

      return ownerEntityToStruct(owner)
    })
  }

  private async doCouchbase ({ ownerId, contactId, status }, user): Promise<OwnerProps> {
    const owner = await this.ownersRepository.get(ownerId) as OwnerProps
    this.logger.debug('Changing owner contact status', { status, ownerId, contactId })
    const updatedOwner = await this.ownersRepository.save(
      changeContactStatus(owner, contactId, status)) as OwnerProps

    await this.publishEvents({ ownerId, contactId, newContactStatus: status, owner, updatedOwner, byUserId: user.id })

    return updatedOwner
  }

  private async publishEvents ({ ownerId, contactId, owner, updatedOwner, em, newContactStatus, byUserId }: {
    ownerId: string,
    contactId: string,
    newContactStatus: string,
    owner: Pick<OwnerProps, 'status' | 'buildingId'>,
    updatedOwner: Pick<OwnerProps, 'status'>,
    em?: EntityManager,
    byUserId: string
  }) {
    await this.eventBus.publish({
      name: DomainEventCatalog.OWNER__CONTACT_STATUS_CHANGED,
      ownerId,
      contactId,
      newContactStatus
    } as OwnerContactStatusChanged, em)

    if (owner.status !== updatedOwner.status) {
      const event: OwnerStatusChangedEvent = {
        name: DomainEventCatalog.OWNER__STATUS_CHANGED,
        ownerId,
        buildingId: owner.buildingId,
        oldStatus: owner.status,
        newStatus: updatedOwner.status,
        byUserId
      }
      await this.eventBus.publish(event, em)
    }
  }
}
