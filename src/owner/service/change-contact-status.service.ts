import { History } from '../../history/models'
import { EventBus } from '../../infrastructure/event-bus'
import { OwnerRepository } from '../repository/owner.repository'
import { changeContactStatus } from '../owner'

export class ChangeContactStatusService {
  constructor (
    private ownersRepository: OwnerRepository,
    private historyRepository: History,
    private eventBus: EventBus
  ) {
  }

  async change ({ ownerId, contactId, status }, user) {
    const contextModel = { _documentType: 'owner-contact', contactId }

    const owner = await this.ownersRepository.get(ownerId)
    const updatedOwner = changeContactStatus(owner, contactId, status)

    await this.historyRepository.register({ type: 'UPDATE', contextModel, user })

    if (owner.status !== updatedOwner.status) {
      this.eventBus.publish({
        name: 'owner.status_changed',
        ownerId,
        oldStatus: owner.status,
        newStatus: updatedOwner.status
      })
    }
  }
}
