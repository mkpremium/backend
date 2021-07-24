import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallerConfig } from '../virtual-caller.config'
import { VirtualCaller } from '../domain/virtual-caller'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerConfig: VirtualCallerConfig;
  virtualCallerPhoneNumber: string
}

export const createStartVirtualCallerController = ({
                                                     virtualCallerSupervisor,
                                                     virtualCallerConfig,
                                                     virtualCallerPhoneNumber,
                                                   }: Deps) => async (req, res) => {
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
    lastWorksheetId: undefined,
    lastOwnerResponse: undefined,
  }).then(() => {
    res.sendStatus(200)
  })
}
