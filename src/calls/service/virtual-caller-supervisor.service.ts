import { ContactsOrderStrategy, OwnerContact, VirtualCallerService } from './virtual-caller.service'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'
import { Logger } from 'winston'
import { WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { flatMap, groupBy } from 'lodash'
import moment from 'moment-timezone'
import { EventBus } from '../../infrastructure/event-bus'
import { Timezone, VirtualCallerProps } from '../domain/virtual-caller'
import { array, ord } from 'fp-ts'
import { Ord } from 'fp-ts/number'

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

    if (outOfWorkingHours(cmd.caller.timezone)) {
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
    return ({ relatedOwners, building: { featuredOwnerId } }: WorksheetViewProps): OwnerContact[] => {
      const allContacts: OwnerContact[] = flatMap(relatedOwners, o => o.person.contacts
        .filter(({ type }) => [ 'TELEFONO', 'MOVIL' ].includes(type))
        .map(c => ({
          ...c,
          ownerId: o.id
        })))

      const contactsOrder = ord.contramap((c: OwnerContact) => {
        if (c.ownerId === featuredOwnerId) {
          return 1
        }
        return c.status === 'GOOD' ? 2 : 3
      })(Ord)
      return array.sort(contactsOrder)(this.uniqueNumbers(allContacts, featuredOwnerId))
    }
  }

  private uniqueNumbers (allContacts: OwnerContact[], featuredOwnerId: string) {
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
      const featuredOwnerContact = samePhoneNumberContacts.find(ca => ca.ownerId === featuredOwnerId)
      let contact = featuredOwnerContact || samePhoneNumberContacts.find(c => c.status === 'GOOD')
      if (!contact) {
        contact = samePhoneNumberContacts[ 0 ]
      }
      return contact
    }).filter(Boolean)
  }
}

const SUNDAY = 7

function outOfWorkingHours (timezone: Timezone) {
  const now = moment().tz(timezone)
  return now.hours() < 9 || now.hours() >= 20 || [ SUNDAY ].includes(now.isoWeekday())
}
