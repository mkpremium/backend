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

  return virtualCallerSupervisor.check({
    callerId: virtualCallerConfig.virtualCallerId,
    queueId: virtualCallerConfig.virtualCallerQueueId,
    maxWorksheets: virtualCallerConfig.maxWorksheets,
  })
}
