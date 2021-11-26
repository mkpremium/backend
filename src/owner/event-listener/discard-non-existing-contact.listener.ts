import { ChangeContactStatusService } from '../service/change-contact-status.service'
import { UnExistingPhoneFound } from '../../calls/service/virtual-caller.service'

interface Deps {
  changeContactStatusService: ChangeContactStatusService,
}

export function discardNonExistingContactListener ({ changeContactStatusService }: Deps) {
  return async function ({ ownerId, contactId }: UnExistingPhoneFound) {
    return changeContactStatusService.change({
      ownerId,
      contactId,
      status: 'BAD'
    }, { id: 'owner-scheduled-call-listener' })
  }
}
