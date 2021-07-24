import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallerConfig } from '../virtual-caller.config'
import { Logger } from 'winston'
import { CallDone } from '../controller/call-done-webhook.controller'
import { VirtualCaller } from '../domain/virtual-caller'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerConfig: VirtualCallerConfig;
  logger: Logger;
  virtualCallerPhoneNumber: string
}

export const createCallFinishedListener = ({
                                             virtualCallerSupervisor,
                                             virtualCallerConfig,
                                             logger,
                                             virtualCallerPhoneNumber,
                                           }: Deps) => async (evt: CallDone) => {
  logger.info('Call finished, checking for more work', { callId: evt.callId })
  // Failed calls respond quickly, so wait to avoid multiple calls to same number.
  const waitPromise = evt.status === 'FAILED' ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()

  await waitPromise

  return virtualCallerSupervisor.check({
    caller: VirtualCaller({
      assignCallsTo: virtualCallerConfig.assignedCallerIdForVirtualCalls,
      id: virtualCallerConfig.virtualCallerId,
      isEnabled: true,
      language: 'spanish',
      name: virtualCallerConfig.virtualCallerId,
      phoneNumber: virtualCallerPhoneNumber,
      queueId: virtualCallerConfig.virtualCallerQueueId,
      timezone: 'Europe/Madrid'
    }),
    maxWorksheets: virtualCallerConfig.maxWorksheets,
    lastWorksheetId: evt.worksheetId,
    lastOwnerResponse: evt.ownerResponse,
  })
}
