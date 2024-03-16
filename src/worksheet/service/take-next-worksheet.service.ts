import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { WorksheetQueueActionsService } from './worksheet-queue-actions-service'
import { CallcenterWorksheetService } from './callcenter-worksheet.service'
import { WorksheetQueueProps } from '../domain/queue'
import type { WorksheetViewProps } from '../repository/worksheet.repository'

export class TakeNextWorksheetService {
  constructor (
    private takeWorksheetService: WorksheetQueueActionsService,
    private callcenterWorksheetService: CallcenterWorksheetService,
    private worksheetQueueRepository: WorksheetQueueRepository
  ) {
  }

  async nextWorksheetInQueueOfId (queueId: string, byUserOfId: string): Promise<WorksheetViewProps> {
    const queue = await this.worksheetQueueRepository.get(queueId)
    return await this.nextWorksheetInQueue(queue, byUserOfId)
  }

  async nextWorksheetInQueue (queue: WorksheetQueueProps, byUserOfId: string): Promise<WorksheetViewProps> {
    const worksheetFromSource = await this.getNextWorksheet(queue, byUserOfId)

    if (!worksheetFromSource) {
      return
    }

    return await this.takeWorksheetService.takeWorksheetInQueue(queue.id, worksheetFromSource.id, byUserOfId, true)
  }

  private getNextWorksheet (queue: WorksheetQueueProps, byUserOfId: string, skipWorksheetId?: string): Promise<WorksheetViewProps> {
    return this.callcenterWorksheetService.nextAvailableWorksheetInSource(queue.source, skipWorksheetId)
      .catch(error => {
        error.queueId = queue.id
        error.byUserOfId = byUserOfId
        error.context = (error.context || '') + ' taking next available worksheet in queue'
        throw error
      })
  }
}
