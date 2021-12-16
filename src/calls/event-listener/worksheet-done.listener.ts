import { WorksheetDone } from '../service/virtual-caller.service'
import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { Logger } from '../../infrastructure/logger'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallersRepository: VirtualCallersRepository;
  logger: Logger;
}

export const createWorksheetDoneListener = ({
                                              virtualCallerSupervisor,
                                              virtualCallersRepository,
                                              logger,
                                            }: Deps
) => async (evt: WorksheetDone) => {
  logger.info('Worksheet done, checking for more work', evt)

  virtualCallerSupervisor.check({
    caller: await virtualCallersRepository.get(evt.callerId),
    lastWorksheetId: undefined,
    lastOwnerResponse: undefined,
  }).catch(error => {
    logger.error('Could not check with virtual caller supervisor', { error: error.message, stack: error.stack })
  })
}

