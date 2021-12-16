import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { VirtualCallerPhonesRepository } from '../repository/virtual-caller-phones.repository'
import { phoneAvailable } from '../domain/caller.phone'
import { CallDone } from '../service/call-finished.processor'
import { Logger } from '../../infrastructure/logger'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService
  virtualCallersRepository: VirtualCallersRepository
  virtualCallerPhonesRepository: VirtualCallerPhonesRepository
  logger: Logger
}

export const continueVirtualCallerLoop = ({
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

  virtualCallerSupervisor.check({
    caller: virtualCaller,
    lastWorksheetId: evt.worksheetId,
    lastOwnerResponse: evt.ownerResponse,
  }).catch(error => {
    logger.error('Could not check with virtual caller supervisor', { error: error.message, stack: error.stack })
  })
}
