import { ContactsOrderStrategy, OwnerContact, VirtualCallerService } from './virtual-caller.service'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'
import { Logger } from 'winston'
import { WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { flatMap, groupBy, sortBy } from 'lodash'
import moment from 'moment-timezone'
import { EventBus } from '../../infrastructure/event-bus'

interface CheckCommand {
  callerId: string;
  queueId: string;
  maxWorksheets?: number
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
    if (outOfWorkingHours()) {
      this.logger.info('Outside of working hours, no call', cmd)
      return
    }

    if (await this.hasReachWorksheetLimit(cmd.callerId, cmd.maxWorksheets)) {
      this.logger.info('All worksheets processed by virtual caller', cmd)
      return
    }

    await this.virtualCaller.processNextWorksheet({
      callerId: cmd.callerId,
      queueId: cmd.queueId,
      contacts: this.contactsOrderStrategy(),
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
      return sortBy(flatMap(relatedOwners, o =>
        flatMap(groupBy(o.person.contacts, 'value'), (contacts) => {
          if (contacts.length > 1) {
            this.logger.info('Duplicated contact in owner', { ownerId: o.id, contactId: contacts[ 0 ].id })
            this.eventBus.publish({
              name: 'virtual-caller.duplicated_contact_detected_in_owner',
              ownerId: o.id,
            }).catch(error => this.logger.error('Couldnt publish event', { error: error.message }))
          }
          if (contacts.find(c => c.status === 'BAD')) {
            return
          }
          let contact = contacts.find(c => c.status === 'GOOD')
          if (!contact) {
            contact = contacts[ 0 ]
          }
          return {
            ...contact,
            ownerId: o.id
          }
        })
      ).filter(Boolean), 'value')
    }
  }
}

const SATURDAY = 6
const SUNDAY = 7

function outOfWorkingHours () {
  const now = moment().tz('Europe/Madrid')
  return now.hours() < 9 || now.hours() >= 20 || [ SATURDAY, SUNDAY ].includes(now.isoWeekday())
}
