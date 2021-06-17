import { VirtualCallerService } from './virtual-caller.service'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'
import { Logger } from 'winston'
import { WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { flatMap, uniqBy } from 'lodash'

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

  static contactsOrderStrategy = ({ relatedOwners }: Pick<WorksheetViewProps, 'relatedOwners'>) => {
    const phoneContacts = flatMap(relatedOwners, o => {
      return o.person.contacts
        .filter(({ type, status }) => [ 'TELEFONO', 'MOVIL' ].includes(type) && status !== 'BAD')
        .map(c => ({ ...c, ownerId: o.id }))
    })

    return uniqBy(phoneContacts, 'value')
  }

  async check (cmd: CheckCommand) {
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
