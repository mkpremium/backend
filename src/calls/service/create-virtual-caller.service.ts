import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { VirtualCaller, VirtualCallerProps } from '../domain/virtual-caller'

type CreateVirtualCallerCommand = {
  phoneNumber: string,
  queueId: string,
  name: string,
  assignCallsTo: string
}

export class CreateVirtualCallerService {
  constructor (
    private virtualCallersRepository: VirtualCallersRepository
  ) {
  }

  async createVirtualCaller (cmd: CreateVirtualCallerCommand) {
    const inferredLocalization = CreateVirtualCallerService.inferLocalization(cmd.phoneNumber)

    await this.virtualCallersRepository.save(VirtualCaller({
      assignCallsTo: cmd.assignCallsTo,
      isEnabled: true,
      name: cmd.name,
      phoneNumber: cmd.phoneNumber,
      queueId: cmd.queueId,
      ...inferredLocalization,
    }))
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
