import { VirtualCallerService } from './virtual-caller.service'

interface CheckCommand {
  callerId: string;
  queueId: string;
  maxWorksheets: number
}

export class VirtualCallerSupervisorService {
  constructor (
    private virtualCaller: VirtualCallerService,
  ) {
  }

  static contactsOrderStrategy = () => []

  async check (cmd: CheckCommand) {
    await this.virtualCaller.processNextWorksheet({
      callerId: cmd.callerId,
      queueId: cmd.queueId,
      contacts: VirtualCallerSupervisorService.contactsOrderStrategy,
    })
  }
}
