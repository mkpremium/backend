import { ChangeContactStatusService } from '../service/change-contact-status.service'

type ChangeContactControllerDependencies = { changeContactStatusService: ChangeContactStatusService }
export const createChangeContactStatusController = ({ changeContactStatusService }: ChangeContactControllerDependencies) =>
  async (req, res) => {
    const { ownerId, contactId } = req.params
    const { status } = req.body

    await changeContactStatusService.change({ ownerId, contactId, status }, req.user)

    res.status(204).send()
  }
