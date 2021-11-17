import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { Logger } from '../../infrastructure/logger'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService
  virtualCallersRepository: VirtualCallersRepository
  logger: Logger
}

export const createStartVirtualCallerController = ({
                                                     virtualCallerSupervisor,
                                                     virtualCallersRepository,
                                                     logger,
                                                   }: Deps) => async (req, res) => {
  res.sendStatus(202)

  const enabledCallers = await virtualCallersRepository.enabledCallers()
  logger.info('Virtual callers to check', { count: enabledCallers.length })

  for (const caller of enabledCallers) {
    try {
      await virtualCallerSupervisor.check({
        caller,
        lastWorksheetId: undefined,
        lastOwnerResponse: undefined,
      })
      logger.info('Caller started', { callerId: caller.id })
    } catch (error) {
      logger.error('Caller start failed', { callerId: caller.id, error: error.message })
    }
  }
}
