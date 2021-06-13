import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { VirtualCallerPhone } from './virtual-caller-phone'
import {
  VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../repository/virtual-caller-worksheets.repository'
import { WorksheetRepository } from '../../worksheet/repository/worksheet.repository'

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

    const contacts = cmd.contacts(worksheet)
    const lastContactPosition = contacts.findIndex(({ id }) => id === w.lastContactId)
    await this.virtualCallerPhone.call(
      worksheet.building.address,
      contacts[ lastContactPosition + 1 ],
      worksheet.id,
    )
  }

  private async startWithNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    const worksheet = await this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId)

    const contacts = cmd.contacts(worksheet)
    await this.virtualCallerPhone.call(worksheet.building.address, contacts[ 0 ], worksheet.id)

    await this.virtualCallerWorksheetsRepository.save({
      worksheetId: worksheet.id,
      callerId: cmd.callerId,
      lastContactId: contacts[ 0 ].id,
      status: 'PROCESSING',
    })
  }
}
