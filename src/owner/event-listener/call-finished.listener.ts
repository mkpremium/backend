import { ChangeContactStatusService } from '../service/change-contact-status.service'
import { CallDone, PHONE_DOES_NOT_EXIST } from '../../calls/service/call-finished.processor'

interface Deps {
  changeContactStatusService: ChangeContactStatusService
}

const landlinePhoneRegexp = /\+349|\+3512/

export function createCallFinishedListener ({ changeContactStatusService }: Deps) {
  return async function (evt: CallDone) {
    if (!mustDiscardContact(evt)) {
      return
    }

    await changeContactStatusService.change({
      ownerId: evt.ownerId,
      contactId: evt.contactId,
      status: 'BAD',
    }, { id: evt.callerId })
  }
}

function mustDiscardContact (evt: CallDone) {
  return evt.status === 'FAILED' && (landlinePhoneRegexp.test(evt.phoneNumber) || evt.error === PHONE_DOES_NOT_EXIST)
}
