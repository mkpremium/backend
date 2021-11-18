import { TakeNextWorksheetService } from '../../worksheet/service/take-next-worksheet.service'
import { ContactProps } from '../../owner/owner'
import { lockingContextAction, NumberDoesNotExist, VirtualCallerPhone } from './virtual-caller-phone'
import {
  VirtualCallerWorksheet,
  VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../repository/virtual-caller-worksheets.repository'
import {
  WorksheetNotFound,
  WorksheetRepository,
  WorksheetViewProps
} from '../../worksheet/repository/worksheet.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import retry from 'bluebird-retry'
import { OwnerResponse } from './owner-response-processor.service'
import { VirtualCallerProps } from '../domain/virtual-caller'
import { NumberAlreadyCalled } from './number-already-called'

export type OwnerContact = ContactProps & { ownerId: string }

export type ContactsOrderStrategy = (worksheet: WorksheetViewProps) => OwnerContact[]

export interface ProcessNextWorksheetCommand {
  caller: VirtualCallerProps;
  lastWorksheetId: string;
  lastOwnerResponse: string;
  contacts: ContactsOrderStrategy;
}

interface RecursiveCall {
  inProgressWorksheet: VirtualCallerWorksheetProps,
  lastCalledWorksheetContactId: string
}

export interface WorksheetDone {
  name: 'virtual_caller.worksheet_done'
  callerId: string
  worksheetId: string
}

export class VirtualCallerService {
  constructor (
    private takeNextWorksheetService: TakeNextWorksheetService,
    private virtualCallerPhone: VirtualCallerPhone,
    private virtualCallerWorksheetsRepository: VirtualCallerWorksheetsRepository,
    private worksheetRepository: WorksheetRepository,
    private eventBus: EventPublisher,
    private logger: Logger,
  ) {
  }

  async processNextWorksheet (cmd: ProcessNextWorksheetCommand, rec?: RecursiveCall) {
    let { inProgressWorksheet, lastCalledWorksheetContactId } = rec || {}
    if (!inProgressWorksheet) {
      inProgressWorksheet = await this.virtualCallerWorksheetsRepository.inProgressWorksheetFor(cmd.caller.id)
      lastCalledWorksheetContactId = inProgressWorksheet ? inProgressWorksheet.lastContactId : undefined
    }
    if (inProgressWorksheet && inProgressWorksheet.worksheetId === cmd.lastWorksheetId && cmd.lastOwnerResponse === OwnerResponse.SALE) {
      return this.saveAndPublishDoneWorksheet(inProgressWorksheet)
    }

    const worksheet = await this.getWorksheet(inProgressWorksheet, cmd)
    const contacts = cmd.contacts(worksheet)
    const contactToCall = this.nextContactToCall(contacts, lastCalledWorksheetContactId)

    if (contactToCall) {
      await this.virtualCallerPhone.call({
        caller: cmd.caller,
        buildingId: worksheet.building.id,
        worksheetId: worksheet.id,
        address: worksheet.building.address,
        contact: contactToCall,
      })
        .then(() => this.saveCalledContact(inProgressWorksheet, worksheet, cmd, contactToCall.id))
        .catch(error => {
          if (error.context && error.context.action === lockingContextAction) {
            this.logger.warning('Error getting lock', { ...error, error: error.message })
            return
          }
          if (error instanceof NumberAlreadyCalled) {
            this.logger.info('Number already called, skipping call', { contactToCall })
          } else if (error instanceof NumberDoesNotExist) {
            this.logger.info('Number does not exist, skipping call', { contactToCall })
          } else {
            this.logger.error('Call failed', { ...error, error: error.message, trace: error.trace, contactToCall })
          }
          return this.saveCalledContact(inProgressWorksheet, worksheet, cmd, contactToCall.id)
            .then(() => this.processNextWorksheet(cmd, {
              inProgressWorksheet,
              lastCalledWorksheetContactId: contactToCall.id
            }))
        })
    } else {
      if (contacts.length === 0) {
        this.logger.info('No contacts found in worksheet', { worksheetId: worksheet.id })
      }
      await this.saveAndPublishDoneWorksheet(inProgressWorksheet || VirtualCallerWorksheet({
        worksheetId: worksheet.id,
        callerId: cmd.caller.id,
        status: 'DONE',
      }))
    }
  }

  private async saveCalledContact (inProgressWorksheet: VirtualCallerWorksheetProps, worksheet: WorksheetViewProps, cmd: ProcessNextWorksheetCommand, contactId: string) {
    if (!inProgressWorksheet) {
      await this.virtualCallerWorksheetsRepository.save(VirtualCallerWorksheet({
        worksheetId: worksheet.id,
        callerId: cmd.caller.id,
        lastContactId: contactId,
        status: 'CALLING',
      }))
    } else {
      await this.virtualCallerWorksheetsRepository.save(VirtualCallerWorksheet({
        ...inProgressWorksheet,
        lastContactId: contactId,
      }))
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

          return new Promise(resolve => setTimeout(resolve, 10000)).then(() => this.takeNextWorksheet(cmd))
        })
    } else {
      worksheet = await this.takeNextWorksheet(cmd)
    }

    return worksheet
  }

  private async takeNextWorksheet (cmd: ProcessNextWorksheetCommand) {
    return retry<WorksheetViewProps>(
      () => this.takeNextWorksheetService.nextWorksheetInQueueOfId(cmd.caller.queueId, cmd.caller.id))
  }

  private nextContactToCall (contacts: OwnerContact[], lastCalledContactId: string | undefined): OwnerContact | undefined {
    if (!lastCalledContactId) {
      return contacts.length > 0 ? contacts[ 0 ] : undefined
    }
    const lastContactPosition = contacts.findIndex(({ id }) => id === lastCalledContactId)

    return lastContactPosition + 1 < contacts.length ? contacts[ lastContactPosition + 1 ] : undefined
  }

  private async saveAndPublishDoneWorksheet (inProgressWorksheet: VirtualCallerWorksheetProps) {
    await this.saveDoneWorksheet(inProgressWorksheet)
    await this.eventBus.publish({
      name: 'virtual_caller.worksheet_done',
      callerId: inProgressWorksheet.callerId,
      worksheetId: inProgressWorksheet.worksheetId,
    } as WorksheetDone)
  }

  private async saveDoneWorksheet (inProgressWorksheet: VirtualCallerWorksheetProps) {
    await this.virtualCallerWorksheetsRepository.save(VirtualCallerWorksheet({
      ...inProgressWorksheet,
      status: 'DONE',
    }))
  }
}
