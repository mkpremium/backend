import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'

export interface StartLoopCommand {
  queueId: string;
  callerId: string;
  contacts: (worksheet: any) => Generator<ContactProps, void, unknown>
}

export class CallerLoopService {
  constructor (
    private takeNextWorksheetService: TakeNextWorksheetService,
  ) {
  }

  async startLoop (cmd: StartLoopCommand) {
    const worksheet = await this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId)
  }
}
