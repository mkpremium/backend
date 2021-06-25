import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { WorksheetNotFound, WorksheetRepository, WorksheetViewProps } from '../repository/worksheet.repository'
import { WorksheetQueueActionsService } from './worksheet-queue-actions-service'
import { EventBus } from '../../infrastructure/event-bus'

export interface InvalidWorksheetFound {
  name: 'worksheet.invalid_worksheet_found';
  worksheetId: string;
}

export class TakeNextWorksheetService {
  constructor (
    private takeWorksheetService: WorksheetQueueActionsService,
    private worksheetRepository: WorksheetRepository,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private eventBus: EventBus
  ) {
  }

  nextWorksheetInQueueOfId (queueId, byUserOfId): Promise<WorksheetViewProps> {
    return this.worksheetQueueRepository.get(queueId).then(queue => this.nextWorksheetInQueue(queue, byUserOfId))
  }

  async nextWorksheetInQueue (queue, byUserOfId): Promise<WorksheetViewProps> {
    let worksheetFromSource
    try {
      worksheetFromSource = await this.getNextWorksheet(queue, byUserOfId)
    } catch (error) {
      if (error instanceof WorksheetNotFound) {
        await this.eventBus.publish({
          name: 'worksheet.invalid_worksheet_found',
          worksheetId: error.worksheetId,
        } as InvalidWorksheetFound)
        worksheetFromSource = await this.getNextWorksheet(queue, byUserOfId, error.worksheetId)
      } else {
        throw error
      }
    }

    if (!worksheetFromSource) {
      return
    }

    const nextWorksheet = await this.takeWorksheetService.takeWorksheetInQueue(queue.id, worksheetFromSource.id, byUserOfId)
    await this.eventBus.publish({
      name: 'worksheet.next_in_queue_taken',
      by: byUserOfId,
      source: queue.source
    })

    return nextWorksheet
  }

  private getNextWorksheet (queue, byUserOfId, skipWorksheetId?): Promise<WorksheetViewProps> {
    return this.worksheetRepository.nextAvailableWorksheetInSource(queue.source, skipWorksheetId)
      .catch(error => {
        error.queueId = queue.id
        error.byUserOfId = byUserOfId
        error.context = (error.context || '') + ' taking next available worksheet in queue'
        throw error
      })
  }
}
