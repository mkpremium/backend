/**
 * @property {WorksheetQueueActionsService} takeWorksheetService
 * @property {WorksheetRepository}  worksheetRepository
 * @property {WorksheetQueueRepository}  worksheetQueueRepository
 */
export class TakeNextWorksheetService {
  constructor (takeWorksheetService, worksheetRepository, worksheetQueueRepository) {
    this.takeWorksheetService = takeWorksheetService
    this.worksheetRepository = worksheetRepository
    this.worksheetQueueRepository = worksheetQueueRepository
  }

  nextWorksheetInQueueOfId (queueId, byUserOfId) {
    return this.worksheetQueueRepository.get(queueId).then(queue => this.nextWorksheetInQueue(queue, byUserOfId))
  }

  async nextWorksheetInQueue (queue, byUserOfId) {
    const worksheetFromSource = await this.worksheetRepository.nextAvailableWorksheetInSource(queue.source)

    if (!worksheetFromSource) {
      return
    }

    return this.takeWorksheetService.takeWorksheetInQueue(queue.id, worksheetFromSource.id, byUserOfId)
  }
}
