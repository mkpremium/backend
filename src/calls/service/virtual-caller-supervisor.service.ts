import { ContactsOrderStrategy, OwnerContact, VirtualCallerService } from './virtual-caller.service'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'
import { Logger } from 'winston'
import { WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { flatMap, groupBy } from 'lodash'
import moment from 'moment-timezone'
import { EventBus } from '../../infrastructure/event-bus'
import { VirtualCallerProps } from '../domain/virtual-caller'

export interface CheckCommand {
  caller: VirtualCallerProps
  maxWorksheets?: number
  lastWorksheetId: string
  lastOwnerResponse: string
}

export class VirtualCallerSupervisorService {
  constructor (
    private virtualCaller: VirtualCallerService,
    private virtualCallerWorksheetsRepository: VirtualCallerWorksheetsRepository,
    private eventBus: EventBus,
    private logger: Logger,
  ) {
  }

  async check (cmd: CheckCommand) {
    if (!cmd.caller.isEnabled) {
      this.logger.info('Caller is disabled', { caller: cmd.caller })
      return
    }

    if (outOfWorkingHours()) {
      this.logger.info('Outside of working hours, no call', cmd)
      return
    }

    if (await this.hasReachWorksheetLimit(cmd.caller.id, cmd.maxWorksheets)) {
      this.logger.info('All worksheets processed by virtual caller', cmd)
      return
    }

    await this.virtualCaller.processNextWorksheet({
      caller: cmd.caller,
      contacts: this.contactsOrderStrategy(),
      lastOwnerResponse: cmd.lastOwnerResponse,
      lastWorksheetId: cmd.lastWorksheetId,
    })
  }

  private async hasReachWorksheetLimit (callerId: string, maxWorksheets?: number) {
    if (!maxWorksheets) {
      return false
    }

    return await this.virtualCallerWorksheetsRepository.numberOfWorksheetsProcessedBy(callerId) >= maxWorksheets
  }

  private contactsOrderStrategy (): ContactsOrderStrategy {
    return ({ relatedOwners }: Pick<WorksheetViewProps, 'relatedOwners'>): OwnerContact[] => {
      const allContacts: OwnerContact[] = flatMap(relatedOwners, o => o.person.contacts
        .filter(({ type }) => [ 'TELEFONO', 'MOVIL' ].includes(type))
        .map(c => ({
          ...c,
          ownerId: o.id
        })))
      return flatMap(groupBy(allContacts, 'value'), samePhoneNumberContacts => {
        if (samePhoneNumberContacts.length > 1) {
          const firstContact = samePhoneNumberContacts[ 0 ]
          this.logger.info('Duplicated contact in owner', { ownerId: firstContact.ownerId, contactId: firstContact.id })
          this.eventBus.publish({
            name: 'virtual-caller.duplicated_contact_detected_in_owner',
            ownerId: firstContact.ownerId,
          }).catch(error => this.logger.error('Couldnt publish event', { error: error.message }))
        }
        if (samePhoneNumberContacts.find(c => c.status === 'BAD')) {
          return
        }
        let contact = samePhoneNumberContacts.find(c => c.status === 'GOOD')
        if (!contact) {
          contact = samePhoneNumberContacts[ 0 ]
        }
        return contact
      }).filter(Boolean)
    }
  }
}

const SATURDAY = 6
const SUNDAY = 7

function outOfWorkingHours () {
  const now = moment().tz('Europe/Madrid')
  return now.hours() < 9 || now.hours() >= 20 || [ SATURDAY, SUNDAY ].includes(now.isoWeekday())
}
