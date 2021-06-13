import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { VirtualCallerPhone } from './virtual-caller-phone'

export interface ProcessNextWorksheetCommand {
  queueId: string;
  callerId: string;
  contacts: (worksheet: any) => Generator<ContactProps, void>;
}

export class VirtualCallerService {
  constructor (
    private takeNextWorksheetService: TakeNextWorksheetService,
    private virtualCallerPhone: VirtualCallerPhone,
  ) {
  }

  async processNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    const worksheet = await this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId)

    for (const contact of cmd.contacts(worksheet)) {
      await this.virtualCallerPhone.call(worksheet.building.address, contact)
    }
  }
}
