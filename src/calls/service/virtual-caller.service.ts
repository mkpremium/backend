import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { VirtualCallerPhone } from './virtual-caller-phone'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'

export interface ProcessNextWorksheetCommand {
  queueId: string;
  callerId: string;
  contacts: (worksheet: any) => ContactProps[];
}

export class VirtualCallerService {
  constructor (
    private takeNextWorksheetService: TakeNextWorksheetService,
    private virtualCallerPhone: VirtualCallerPhone,
    private virtualCallerWorksheetsRepository: VirtualCallerWorksheetsRepository,
  ) {
  }

  async processNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    const worksheet = await this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId)
    await this.virtualCallerWorksheetsRepository.save({
      worksheetId: worksheet.id,
      callerId: cmd.callerId,
      lastContactId: null,
      status: 'PROCESSING',
    })

    for (const contact of cmd.contacts(worksheet)) {
      await this.virtualCallerPhone.call(worksheet.building.address, contact)
    }
  }
}
