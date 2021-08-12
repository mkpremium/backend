import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { Logger } from 'winston'
import { CallDone } from '../controller/call-done-webhook.controller'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { VirtualCallerPhonesRepository } from '../repository/virtual-caller-phones.repository'
import { phoneAvailable } from '../domain/caller.phone'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService
  virtualCallersRepository: VirtualCallersRepository
  virtualCallerPhonesRepository: VirtualCallerPhonesRepository
  logger: Pick<Logger, 'info'>
}

export const createCallFinishedListener = ({
                                             virtualCallerSupervisor,
                                             logger,
                                             virtualCallersRepository,
                                             virtualCallerPhonesRepository,
                                           }: Deps) => async (evt: CallDone) => {
  logger.info('Call finished, checking for more work', { callId: evt.callId })
  // Failed calls respond quickly, so wait to avoid multiple calls to same number.
  const waitPromise = evt.status === 'FAILED' ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()

  await waitPromise

  const virtualCaller = await virtualCallersRepository.get(evt.callerId)

  const lockedPhone = await virtualCallerPhonesRepository.lockPhone(virtualCaller.phoneNumber)
  await virtualCallerPhonesRepository.saveWithLock({ cas: lockedPhone.cas, phone: phoneAvailable(lockedPhone.phone) })

  return virtualCallerSupervisor.check({
    caller: virtualCaller,
    lastWorksheetId: evt.worksheetId,
    lastOwnerResponse: evt.ownerResponse,
  })
}
