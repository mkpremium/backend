import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { WorksheetQueueActionsService } from './worksheet-queue-actions-service'
import { EventBus } from '../../infrastructure/event-bus'

export class TakeNextWorksheetService {
  constructor (
    private takeWorksheetService: WorksheetQueueActionsService,
    private worksheetRepository: WorksheetRepository,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private eventBus: EventBus
  ) {
  }

  nextWorksheetInQueueOfId (queueId, byUserOfId) {
    return this.worksheetQueueRepository.get(queueId).then(queue => this.nextWorksheetInQueue(queue, byUserOfId))
  }

  async nextWorksheetInQueue (queue, byUserOfId) {
    const worksheetFromSource = await this.worksheetRepository.nextAvailableWorksheetInSource(queue.source, queue.id)
      .catch(error => {
        error.queueId = queue.id
        error.byUserOfId = byUserOfId
        error.context = 'taking next available worksheet in queue'
        throw error
      })

    if (!worksheetFromSource) {
      return
    }

    const nextWorksheet = await this.takeWorksheetService.takeWorksheetInQueue(queue.id, worksheetFromSource.id, byUserOfId)
    this.eventBus.publish({
      name: 'worksheet.next_in_queue_taken',
      by: byUserOfId,
      source: queue.source
    })

    return nextWorksheet
  }
}
