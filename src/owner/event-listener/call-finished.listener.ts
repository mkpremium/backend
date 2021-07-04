import { CallDone } from '../../calls/controller/call-done-webhook.controller'
import { ChangeContactStatusService } from '../service/change-contact-status.service'

interface Deps {
  changeContactStatusService: ChangeContactStatusService
}

export function createCallFinishedListener ({ changeContactStatusService }: Deps) {
  return async function (evt: CallDone) {
    await changeContactStatusService.change({
      ownerId: evt.ownerId,
      contactId: evt.contactId,
      status: 'BAD',
    }, {})
  }
}
