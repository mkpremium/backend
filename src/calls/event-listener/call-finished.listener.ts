import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { Logger } from 'winston'
import { CallDone } from '../controller/call-done-webhook.controller'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService
  virtualCallersRepository: VirtualCallersRepository
  virtualCallsRepository: VirtualCallsRepository
  logger: Pick<Logger, 'info'>
}

export const createCallFinishedListener = ({
                                             virtualCallerSupervisor,
                                             logger,
                                             virtualCallersRepository,
                                             virtualCallsRepository,
                                           }: Deps) => async (evt: CallDone) => {
  logger.info('Call finished, checking for more work', { callId: evt.callId })
  // Failed calls respond quickly, so wait to avoid multiple calls to same number.
  const waitPromise = evt.status === 'FAILED' ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()

  await waitPromise

  const virtualCaller = await virtualCallersRepository.get(evt.callerId)

  await virtualCallsRepository.savePhoneStatus(virtualCaller.phoneNumber, 'AVAILABLE')

  return virtualCallerSupervisor.check({
    caller: virtualCaller,
    lastWorksheetId: evt.worksheetId,
    lastOwnerResponse: evt.ownerResponse,
  })
}
