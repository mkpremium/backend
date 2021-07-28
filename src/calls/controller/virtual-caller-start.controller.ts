import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService
  virtualCallersRepository: VirtualCallersRepository
}

export const createStartVirtualCallerController = ({
                                                     virtualCallerSupervisor,
                                                     virtualCallersRepository,
                                                   }: Deps) => async (req, res) => {
  const enabledCallers = await virtualCallersRepository.enabledCallers()

  return Promise.all(enabledCallers.map(caller => {
      return virtualCallerSupervisor.check({
        caller,
        lastWorksheetId: undefined,
        lastOwnerResponse: undefined,
      })
    })
  ).then(() => res.json())
}
