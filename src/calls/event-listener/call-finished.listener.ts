import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallerConfig } from '../virtual-caller.config'
import { Logger } from 'winston'
import { CallDone } from '../controller/call-done-webhook.controller'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerConfig: VirtualCallerConfig;
  logger: Logger;
}

export const createCallFinishedListener = ({
                                             virtualCallerSupervisor,
                                             virtualCallerConfig,
                                             logger
                                           }: Deps) => async (evt: CallDone) => {
  logger.info('Call finished, checking for more work', { callId: evt.callId })
  // Failed calls respond quickly, so wait to avoid multiple calls to same number.
  const waitPromise = evt.status === 'FAILED' ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()

  await waitPromise

  return virtualCallerSupervisor.check({
    callerId: virtualCallerConfig.virtualCallerId,
    queueId: virtualCallerConfig.virtualCallerQueueId,
    maxWorksheets: virtualCallerConfig.maxWorksheets,
    lastWorksheetId: evt.worksheetId,
    lastOwnerResponse: evt.ownerResponse,
  })
}
