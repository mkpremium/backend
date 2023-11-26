import { History } from '../../history/models'
import { EventPublisher } from '../../infrastructure/event-bus'
import { OwnerRepository } from '../repository/owner.repository'
import { changeContactStatus, OwnerProps, OwnerStatus } from '../owner'

export interface OwnerStatusChangedEvent {
  name: 'owner.status_changed';
  ownerId: string;
  buildingId: string;
  oldStatus: OwnerStatus;
  newStatus: OwnerStatus;
}

export interface OwnerContactStatusChanged {
  name: 'owner.contact_status_changed'
  ownerId: string
  contactId: string
  newContactStatus: 'GOOD' | 'BAD' | 'UNDEFINED'
}

export class ChangeContactStatusService {
  constructor (
    private ownersRepository: OwnerRepository,
    private historyRepository: History,
    private eventBus: EventPublisher,
  ) {
  }

  async change ({ ownerId, contactId, status }, user): Promise<OwnerProps> {
    const contextModel = { _documentType: 'owner-contact', modelId: contactId }

    const owner = await this.ownersRepository.get(ownerId) as OwnerProps
    const updatedOwner = await this.ownersRepository.save(
      changeContactStatus(owner, contactId, status)) as OwnerProps

    await this.historyRepository.register({ type: 'UPDATE', contextModel, user })
    await this.eventBus.publish({
      name: 'owner.contact_status_changed',
      ownerId,
      contactId,
      newContactStatus: status,
    } as OwnerContactStatusChanged)

    if (owner.status !== updatedOwner.status) {
      const event: OwnerStatusChangedEvent = {
        name: 'owner.status_changed',
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
