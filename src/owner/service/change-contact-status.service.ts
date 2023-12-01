import { History } from '../../history/models'
import { EventPublisher } from '../../infrastructure/event-bus'
import { OwnerRepository } from '../repository/owner.repository'
import { changeContactStatus, OwnerProps, OwnerStatus } from '../owner'
import { Logger } from 'winston'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

export interface OwnerStatusChangedEvent {
  name: DomainEventCatalog.OWNER__STATUS_CHANGED;
  ownerId: string;
  buildingId: string;
  oldStatus: OwnerStatus;
  newStatus: OwnerStatus;
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
    private historyRepository: History,
    private eventBus: EventPublisher,
    private logger: Logger,
  ) {
  }

  async change ({ ownerId, contactId, status }, user): Promise<OwnerProps> {
    const contextModel = { _documentType: 'owner-contact', modelId: contactId }

    const owner = await this.ownersRepository.get(ownerId) as OwnerProps
    this.logger.debug('Changing owner contact status', { status, ownerId, contactId })
    const updatedOwner = await this.ownersRepository.save(
      changeContactStatus(owner, contactId, status)) as OwnerProps

    await this.historyRepository.register({ type: 'UPDATE', contextModel, user })
    await this.eventBus.publish({
      name: DomainEventCatalog.OWNER__CONTACT_STATUS_CHANGED,
      ownerId,
      contactId,
      newContactStatus: status,
    } as OwnerContactStatusChanged)

    if (owner.status !== updatedOwner.status) {
      const event: OwnerStatusChangedEvent = {
        name: DomainEventCatalog.OWNER__STATUS_CHANGED,
        ownerId,
        buildingId: owner.buildingId,
        oldStatus: owner.status,
        newStatus: updatedOwner.status
      }
      await this.eventBus.publish(event)
    }

    return updatedOwner
  }
}
