import { ChangeContactStatusService } from '../service/change-contact-status.service'
import { CallDone } from '../../calls/service/call-finished.processor'

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
