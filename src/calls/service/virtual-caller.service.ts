import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { VirtualCallerPhone } from './virtual-caller-phone'
import {
  VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../repository/virtual-caller-worksheets.repository'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'

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
    private worksheetRepository: WorksheetRepository,
  ) {
  }

  async processNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    const inProgressWorksheet = await this.virtualCallerWorksheetsRepository.inProgressWorksheetFor(cmd.callerId)
    if (inProgressWorksheet) {
      await this.continueWithWorksheet(cmd, inProgressWorksheet)
    } else {
      await this.startWithNextWorksheet(cmd)
    }
  }

  private async continueWithWorksheet (cmd: ProcessNextWorksheetCommand, w: VirtualCallerWorksheetProps) {
    const worksheet = await this.worksheetRepository.getForCallcenterView(w.worksheetId)

    await this.callNextWorksheetContact(worksheet, cmd, w.lastContactId)
  }

  private async startWithNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    const worksheet = await this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId)

    await this.callNextWorksheetContact(worksheet, cmd)
  }

  private async callNextWorksheetContact (
    worksheet: WorksheetViewProps,
    cmd: ProcessNextWorksheetCommand,
    lastContactCalledId?: string,
  ) {
    const contacts = cmd.contacts(worksheet)
    const contactToCall = this.nextContactToCall(contacts, lastContactCalledId)
    await this.virtualCallerPhone.call(worksheet.building.address, contactToCall, worksheet.id)
    await this.virtualCallerWorksheetsRepository.save({
      worksheetId: worksheet.id,
      callerId: cmd.callerId,
      lastContactId: contactToCall.id,
      status: 'CALLING',
    })
  }

  private nextContactToCall (contacts: ContactProps[], lastCalledContactId: string | undefined) {
    if (!lastCalledContactId) {
      return contacts[ 0 ]
    }
    const lastContactPosition = contacts.findIndex(({ id }) => id === lastCalledContactId)

    return contacts[ lastContactPosition + 1 ]
  }
}
