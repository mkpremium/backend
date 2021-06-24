import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { VirtualCallerPhone } from './virtual-caller-phone'
import {
  VirtualCallerWorksheet, VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../repository/virtual-caller-worksheets.repository'
import {
  WorksheetNotFound,
  WorksheetRepository,
  WorksheetViewProps
} from '../../worksheet/repository/worksheet.repository'
import { EventBus } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import retry from 'bluebird-retry'

export type OwnerContact = ContactProps & { ownerId: string }

export interface ProcessNextWorksheetCommand {
  queueId: string;
  callerId: string;
  contacts: (worksheet: Pick<WorksheetViewProps, 'relatedOwners'>) => (OwnerContact)[];
}

export interface WorksheetDone {
  name: 'virtual-caller.worksheet_done';
  worksheetId: string;
}

export class VirtualCallerService {
  constructor (
    private takeNextWorksheetService: TakeNextWorksheetService,
    private virtualCallerPhone: VirtualCallerPhone,
    private virtualCallerWorksheetsRepository: VirtualCallerWorksheetsRepository,
    private worksheetRepository: WorksheetRepository,
    private eventBus: EventBus,
    private logger: Logger,
  ) {
  }

  async processNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    const inProgressWorksheet = await this.virtualCallerWorksheetsRepository.inProgressWorksheetFor(cmd.callerId)
    const worksheet = await this.getWorksheet(inProgressWorksheet, cmd)

    const lastCalledWorksheetContactId = inProgressWorksheet ? inProgressWorksheet.lastContactId : undefined
    const contactToCall = this.nextContactToCall(cmd.contacts(worksheet), lastCalledWorksheetContactId)

    if (contactToCall) {
      await this.virtualCallerPhone.call({
        buildingId: worksheet.building.id,
        worksheetId: worksheet.id,
        address: worksheet.building.address,
        contact: contactToCall,
      }).catch(error => {
        this.logger.error('Call failed', { ...error, error: error.message, trace: error.trace })
        setTimeout(() => this.processNextWorksheet(cmd), 3000)
      })

      if (!inProgressWorksheet) {
        await this.virtualCallerWorksheetsRepository.save(VirtualCallerWorksheet({
          worksheetId: worksheet.id,
          callerId: cmd.callerId,
          lastContactId: contactToCall.id,
          status: 'CALLING',
        }))
      } else {
        await this.virtualCallerWorksheetsRepository.save(VirtualCallerWorksheet({
          ...inProgressWorksheet,
          lastContactId: contactToCall.id,
        }))
      }
    } else {
      await this.saveDoneWorksheet(inProgressWorksheet)
    }
  }

  private async getWorksheet (inProgressWorksheet: VirtualCallerWorksheetProps, cmd: ProcessNextWorksheetCommand) {
    let worksheet: WorksheetViewProps

    if (inProgressWorksheet) {
      worksheet = await this.worksheetRepository.getForCallcenterView(inProgressWorksheet.worksheetId)
        .catch(error => {
          if (!(error instanceof WorksheetNotFound)) {
            throw error
          }

          this.logger.info('Worksheet not found, taking next', { worksheetId: inProgressWorksheet.worksheetId })
          this.saveDoneWorksheet(inProgressWorksheet)
            .catch(error => this.logger.error('Saving done worksheet', { error: error.message }))

          return this.takeNextWorksheet(cmd)
        })
    } else {
      worksheet = await this.takeNextWorksheet(cmd)
    }

    return worksheet
  }

  private async takeNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    return retry<WorksheetViewProps>(
      () => this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.queueId, cmd.callerId))
  }

  private nextContactToCall (contacts: OwnerContact[], lastCalledContactId: string | undefined): OwnerContact | undefined {
    if (!lastCalledContactId) {
      return contacts[ 0 ]
    }
    const lastContactPosition = contacts.findIndex(({ id }) => id === lastCalledContactId)

    return lastContactPosition + 1 < contacts.length ? contacts[ lastContactPosition + 1 ] : undefined
  }

  private async saveDoneWorksheet (inProgressWorksheet: VirtualCallerWorksheetProps) {
    await this.virtualCallerWorksheetsRepository.save(VirtualCallerWorksheet({
      ...inProgressWorksheet,
      status: 'DONE',
    }))
    await this.eventBus.publish({
      name: 'virtual-caller.worksheet_done',
      worksheetId: inProgressWorksheet.worksheetId,
    } as WorksheetDone)
  }
}
