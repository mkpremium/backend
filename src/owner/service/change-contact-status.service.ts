import { OwnerRepository } from '../models'
import { History } from '../../history/models'
import { EventBus } from '../../infrastructure/event-bus'

export class ChangeContactStatusService {
  constructor (
    private legacyOwnersRepository: OwnerRepository,
    private historyRepository: History,
    private eventBus: EventBus
  ) {
  }

  async change ({ ownerId, contactId, status }, user) {
    const contextModel = { _documentType: 'owner-contact', contactId }

    const updatedOwner = await this.legacyOwnersRepository.changeContactStatus(ownerId, contactId, status)
    await this.historyRepository.register({ type: 'UPDATE', contextModel, user })

    this.eventBus.publish({
      name: 'owner.contact_status_changed',
      ownerId,
      updatedOwner
    })
  }
}
