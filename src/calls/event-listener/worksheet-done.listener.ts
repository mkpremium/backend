import { WorksheetDone } from '../service/virtual-caller.service'
import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { Logger } from 'winston'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallersRepository: VirtualCallersRepository;
  logger: Pick<Logger, 'info'>;
}

export const createWorksheetDoneListener = ({
                                              virtualCallerSupervisor,
                                              virtualCallersRepository,
                                              logger,
                                            }: Deps
) => async (evt: WorksheetDone) => {
  logger.info('Worksheet done, checking for more work', evt)

  return virtualCallerSupervisor.check({
    caller: await virtualCallersRepository.get(evt.callerId),
    lastWorksheetId: undefined,
    lastOwnerResponse: undefined,
  })
}

