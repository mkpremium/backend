import { OwnerRepository } from '../models'
import { History } from '../../history/models'

type ChangeContactControllerDependencies = { legacyOwnersRepository: OwnerRepository, historyRepository: History }
export const createChangeContactStatusController = ({
                                                      legacyOwnersRepository,
                                                      historyRepository
                                                    }: ChangeContactControllerDependencies) =>
  async (req, res) => {
    const ownerId = req.params.id
    const contactId = req.params.contactId
    const contextModel = { _documentType: 'owner-contact', contactId }

    const { status } = req.body
    await legacyOwnersRepository.changeContactStatus(ownerId, contactId, status)
    await historyRepository.register({ type: 'UPDATE', contextModel, user: req.user })

    res.status(204).send()
  }
