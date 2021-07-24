import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { Logger } from 'winston'
import { CallDone } from '../controller/call-done-webhook.controller'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService
  virtualCallersRepository: VirtualCallersRepository
  logger: Pick<Logger, 'info'>
}

export const createCallFinishedListener = ({
                                             virtualCallerSupervisor,
                                             logger,
                                             virtualCallersRepository,
                                           }: Deps) => async (evt: CallDone) => {
  logger.info('Call finished, checking for more work', { callId: evt.callId })
  // Failed calls respond quickly, so wait to avoid multiple calls to same number.
  const waitPromise = evt.status === 'FAILED' ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()

  await waitPromise

  return virtualCallerSupervisor.check({
    caller: await virtualCallersRepository.get(evt.callerId),
    lastWorksheetId: evt.worksheetId,
    lastOwnerResponse: evt.ownerResponse,
  })
}
