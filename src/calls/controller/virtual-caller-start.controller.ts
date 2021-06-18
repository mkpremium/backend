import { VirtualCallerSupervisorService } from '../service/virtual-caller-supervisor.service'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'

interface Deps {
  virtualCallerSupervisor: VirtualCallerSupervisorService;
  virtualCallerQueueId: string;
  virtualCallerId: string;
}

export const createStartVirtualCallerController = ({
                                                     virtualCallerSupervisor,
                                                     virtualCallerId,
                                                     virtualCallerQueueId
                                                   }: Deps) => async (req, res) => {
  const { maxWorksheets } = req.query
  if (!maxWorksheets) {
    throw new InvalidCommand([ new Error('No maxWorksheets parameter provided') ])
  }

  return virtualCallerSupervisor.check({
    maxWorksheets,
    callerId: virtualCallerId,
    queueId: virtualCallerQueueId,
  }).then(() => {
    res.sendStatus(200)
  })
}
