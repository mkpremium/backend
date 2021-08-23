import { VirtualCallersRepository } from '../../calls/repository/virtual-callers.repository'
import { SmsReceived } from '../../calls/service/sms-webhook.processor'
import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'

interface Deps {
  scheduledCallsRepository: ScheduledCallsRepository
  virtualCallersRepository: VirtualCallersRepository
}

export function scheduledCallFromOwnerMessage ({ scheduledCallsRepository, virtualCallersRepository }: Deps) {
  return async function (evt: SmsReceived) {
    const virtualCaller = await virtualCallersRepository.get(evt.callerId)

    await scheduledCallsRepository.save({
      type: 'CALLS',
      createdBy: evt.callerId,
      notifyTo: virtualCaller.assignCallsTo,
      event: {
        buildingId: evt.buildingId,
        worksheetId: evt.worksheetId,
        ownerId: evt.ownerId,
        contactId: evt.contactId,
      }
    })
  }
}
