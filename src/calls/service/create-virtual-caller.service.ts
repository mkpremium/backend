import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { VirtualCaller, VirtualCallerProps } from '../domain/virtual-caller'
import { WorksheetQueueRepository } from '../../worksheet/repository/worksheet-queue.repository'
import { UserRepository } from '../../user/repository/user.repository'

type CreateVirtualCallerCommand = {
  phoneNumber: string,
  queueId: string,
  name: string,
  assignCallsTo: string
}

export class CreateVirtualCallerService {
  constructor (
    private virtualCallersRepository: VirtualCallersRepository,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private usersRepository: UserRepository,
  ) {
  }

  async createVirtualCaller (cmd: CreateVirtualCallerCommand) {
    await this.worksheetQueueRepository.get(cmd.queueId)
    await this.usersRepository.get(cmd.assignCallsTo)

    const inferredLocalization = CreateVirtualCallerService.inferLocalization(cmd.phoneNumber)

    const virtualCaller = VirtualCaller({
      assignCallsTo: cmd.assignCallsTo,
      isEnabled: true,
      name: cmd.name,
      phoneNumber: cmd.phoneNumber,
      queueId: cmd.queueId,
      ...inferredLocalization,
    })
    await this.virtualCallersRepository.save(virtualCaller)

    return virtualCaller
  }

  private static inferLocalization (phoneNumber: string): Pick<VirtualCallerProps, 'language' | 'timezone'> {
    if (phoneNumber.startsWith('+34')) {
      return {
        language: 'spanish',
        timezone: 'Europe/Madrid',
      }
    }
    if (phoneNumber.startsWith('+351')) {
      return {
        language: 'portuguese',
        timezone: 'Europe/Lisbon',
      }
    }
  }
}
