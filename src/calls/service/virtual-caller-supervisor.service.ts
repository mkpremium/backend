import { OwnerContact, VirtualCallerService } from './virtual-caller.service'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'
import { Logger } from 'winston'
import { WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { flatMap, groupBy, sortBy } from 'lodash'
import moment from 'moment-timezone'

interface CheckCommand {
  callerId: string;
  queueId: string;
  maxWorksheets: number
}

export class VirtualCallerSupervisorService {
  constructor (
    private virtualCaller: VirtualCallerService,
    private virtualCallerWorksheetsRepository: VirtualCallerWorksheetsRepository,
    private logger: Logger,
  ) {
  }

  static contactsOrderStrategy = ({ relatedOwners }: Pick<WorksheetViewProps, 'relatedOwners'>): OwnerContact[] => {
    return sortBy(flatMap(relatedOwners, o =>
      flatMap(groupBy(o.person.contacts, 'value'), (contacts) => {
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

  async check (cmd: CheckCommand) {
    if (outOfWorkingHours()) {
      this.logger.info('Outside of working hours, no call', cmd)
      return
    }

    const worksheetsProcessedByCaller = await this.virtualCallerWorksheetsRepository.numberOfWorksheetsProcessedBy(cmd.callerId)
    if (worksheetsProcessedByCaller >= cmd.maxWorksheets) {
      this.logger.info('All worksheets processed by virtual caller', cmd)
      return
    }

    await this.virtualCaller.processNextWorksheet({
      callerId: cmd.callerId,
      queueId: cmd.queueId,
      contacts: VirtualCallerSupervisorService.contactsOrderStrategy,
    })
  }

}

const SATURDAY = 6
const SUNDAY = 7

function outOfWorkingHours () {
  const now = moment().tz('Europe/Madrid')
  return now.hours() < 9 || now.hours() >= 20 || [ SATURDAY, SUNDAY ].includes(now.isoWeekday())
}
