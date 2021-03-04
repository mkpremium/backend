/**
 * @property {WorksheetQueueActionsService} takeWorksheetService
 * @property {WorksheetRepository}  worksheetRepository
 * @property {WorksheetQueueRepository}  worksheetQueueRepository
 * @property {EventBus} eventBus
 */
export class TakeNextWorksheetService {
  constructor (takeWorksheetService, worksheetRepository, worksheetQueueRepository, eventBus) {
    this.takeWorksheetService = takeWorksheetService
    this.worksheetRepository = worksheetRepository
    this.worksheetQueueRepository = worksheetQueueRepository
    this.eventBus = eventBus
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
