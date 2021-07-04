import { CallDone } from '../../calls/controller/call-done-webhook.controller'
import { ChangeContactStatusService } from '../service/change-contact-status.service'

interface Deps {
  changeContactStatusService: ChangeContactStatusService
}

const landlinePhoneRegexp = /\+349|\+3512/

export function createCallFinishedListener ({ changeContactStatusService }: Deps) {
  return async function (evt: CallDone) {
    if (evt.status !== 'FAILED' || !landlinePhoneRegexp.test(evt.phoneNumber)) {
      return
    }

    await changeContactStatusService.change({
      ownerId: evt.ownerId,
      contactId: evt.contactId,
      status: 'BAD',
    }, { id: evt.callerId })
  }
}
