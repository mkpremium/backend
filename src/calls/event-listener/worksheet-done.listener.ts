import { WorksheetDone } from '../service/virtual-caller.service'
import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallerConfig } from '../virtual-caller.config'
import { Logger } from 'winston'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerConfig: VirtualCallerConfig;
  logger: Logger;
}

export const createWorksheetDoneListener = ({
                                              virtualCallerSupervisor,
                                              virtualCallerConfig,
                                              logger,
                                            }: Deps
) => async (evt: WorksheetDone) => {
  logger.info('Worksheet done, checking for more work', { worksheetId: evt.worksheetId })

  return virtualCallerSupervisor.check({
    callerId: virtualCallerConfig.virtualCallerId,
    queueId: virtualCallerConfig.virtualCallerQueueId,
    maxWorksheets: virtualCallerConfig.maxWorksheets,
    lastWorksheetId: undefined,
    lastOwnerResponse: undefined,
  })
}

