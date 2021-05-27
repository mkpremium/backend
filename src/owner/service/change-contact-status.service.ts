import { History } from '../../history/models'
import { EventBus } from '../../infrastructure/event-bus'
import { OwnerRepository } from '../repository/owner.repository'
import { changeContactStatus, OwnerProps, OwnerStatus } from '../owner'

export interface OwnerStatusChangedEvent {
  name: 'owner.status_changed';
  ownerId: string;
  buildingId: string;
  oldStatus: OwnerStatus;
  newStatus: OwnerStatus;
}

export class ChangeContactStatusService {
  constructor (
    private ownersRepository: OwnerRepository,
    private historyRepository: History,
    private eventBus: EventBus
  ) {
  }

  async change ({ ownerId, contactId, status }, user): Promise<OwnerProps> {
    const contextModel = { _documentType: 'owner-contact', contactId }

    const owner = await this.ownersRepository.get(ownerId) as OwnerProps
    const updatedOwner = await this.ownersRepository.save(changeContactStatus(owner, contactId, status)) as OwnerProps

    await this.historyRepository.register({ type: 'UPDATE', contextModel, user })

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
