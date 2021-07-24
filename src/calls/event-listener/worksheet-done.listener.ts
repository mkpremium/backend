import { WorksheetDone } from '../service/virtual-caller.service'
import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallerConfig } from '../virtual-caller.config'
import { Logger } from 'winston'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerConfig: VirtualCallerConfig;
  virtualCallerPhoneNumber: string;
  logger: Logger;
}

export const createWorksheetDoneListener = ({
                                              virtualCallerSupervisor,
                                              virtualCallerConfig,
                                              logger,
                                              virtualCallerPhoneNumber,
                                            }: Deps
) => async (evt: WorksheetDone) => {
  logger.info('Worksheet done, checking for more work', { worksheetId: evt.worksheetId })

  return virtualCallerSupervisor.check({
    caller: {
      assignCallsTo: virtualCallerConfig.assignedCallerIdForVirtualCalls,
      id: virtualCallerConfig.virtualCallerId,
      isEnabled: true,
      language: 'spanish',
      name: virtualCallerConfig.virtualCallerId,
      phoneNumber: virtualCallerPhoneNumber,
      queueId: virtualCallerConfig.virtualCallerQueueId,
      timezone: 'Europe/Madrid'
    },
    maxWorksheets: virtualCallerConfig.maxWorksheets,
    lastWorksheetId: undefined,
    lastOwnerResponse: undefined,
  })
}

