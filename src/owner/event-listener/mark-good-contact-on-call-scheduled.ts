import { CallScheduled } from '../../scheduled-events/service/schedule-call.service'
import { ChangeContactStatusService } from '../service/change-contact-status.service'

interface Deps {
  changeContactStatusService: ChangeContactStatusService,
}

export function markGoodContactOnCallScheduled ({ changeContactStatusService }: Deps) {
  return async function ({ ownerId, contactId }: CallScheduled) {
    return changeContactStatusService.change({
      ownerId,
      contactId,
      status: 'GOOD'
    }, { id: 'owner-scheduled-call-listener' })
  }
}
