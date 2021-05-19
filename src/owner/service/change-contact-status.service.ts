import { OwnerRepository } from '../models'
import { History } from '../../history/models'

export class ChangeContactStatusService {
  constructor (
    private legacyOwnersRepository: OwnerRepository,
    private historyRepository: History
  ) {
  }

  async change ({ ownerId, contactId, status }, user) {
    const contextModel = { _documentType: 'owner-contact', contactId }

    await this.legacyOwnersRepository.changeContactStatus(ownerId, contactId, status)
    await this.historyRepository.register({ type: 'UPDATE', contextModel, user })
  }
}
