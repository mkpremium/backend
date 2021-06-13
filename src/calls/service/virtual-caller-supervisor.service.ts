import { VirtualCallerService } from './virtual-caller.service'
import { VirtualCallerWorksheetsRepository } from '../repository/virtual-caller-worksheets.repository'
import { Logger } from 'winston'

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

  static contactsOrderStrategy = () => []

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
