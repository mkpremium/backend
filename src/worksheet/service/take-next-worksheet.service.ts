import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { WorksheetNotFound, WorksheetViewProps } from '../repository/worksheet.repository'
import { WorksheetQueueActionsService } from './worksheet-queue-actions-service'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CallcenterWorksheetService } from './callcenter-worksheet.service'

export interface InvalidWorksheetFound {
  name: 'worksheet.invalid_worksheet_found';
  worksheetId: string;
}

export class TakeNextWorksheetService {
  constructor (
    private takeWorksheetService: WorksheetQueueActionsService,
    private callcenterWorksheetService: CallcenterWorksheetService,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private eventBus: EventPublisher,
  ) {
  }

  async nextWorksheetInQueueOfId (queueId: string, byUserOfId: string): Promise<WorksheetViewProps> {
    const queue = await this.worksheetQueueRepository.get(queueId)
    return await this.nextWorksheetInQueue(queue, byUserOfId)
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
      name: DomainEventCatalog.WORKSHEET__NEXT_IN_QUEUE_TAKEN,
      by: byUserOfId,
      source: queue.source
    })

    return nextWorksheet
  }

  private getNextWorksheet (queue, byUserOfId, skipWorksheetId?): Promise<WorksheetViewProps> {
    return this.callcenterWorksheetService.nextAvailableWorksheetInSource(queue.source, skipWorksheetId)
      .catch(error => {
        error.queueId = queue.id
        error.byUserOfId = byUserOfId
        error.context = (error.context || '') + ' taking next available worksheet in queue'
        throw error
      })
  }
}
