import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallerConfig } from '../virtual-caller.config'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerConfig: VirtualCallerConfig;
}

export const createStartVirtualCallerController = ({
                                                     virtualCallerSupervisor,
                                                     virtualCallerConfig
                                                   }: Deps) => async (req, res) => {
  return virtualCallerSupervisor.check({
    callerId: virtualCallerConfig.virtualCallerId,
    queueId: virtualCallerConfig.virtualCallerQueueId,
    maxWorksheets: virtualCallerConfig.maxWorksheets,
    lastWorksheetId: undefined,
    lastOwnerResponse: undefined,
  }).then(() => {
    res.sendStatus(200)
  })
}
