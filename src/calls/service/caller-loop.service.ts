import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { VirtualCallerService } from './virtual-caller.service'

export interface StartLoopCommand {
  queueId: string;
  callerId: string;
  contacts: (worksheet: any) => Generator<ContactProps, void, unknown>
}

export class CallerLoopService {
  constructor (
    private takeNextWorksheetService: TakeNextWorksheetService,
    private virtualCallerService: VirtualCallerService,
  ) {
  }

  async startLoop (cmd: StartLoopCommand) {
    const worksheet = await this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId)

    for (const contact of cmd.contacts(worksheet)) {
      await this.virtualCallerService.call(worksheet.building.address, contact)
    }
  }
}
