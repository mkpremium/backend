/**
 * @property {WorksheetQueueActionsService} takeWorksheetService
 * @property {WorksheetRepository}  worksheetRepository
 */
export class TakeNextWorksheetService {
  constructor (takeWorksheetService, worksheetRepository) {
    this.takeWorksheetService = takeWorksheetService
    this.worksheetRepository = worksheetRepository
  }

  async nextWorksheetInQueue (queue, byUserOfId) {
    const worksheetFromSource = await this.worksheetRepository.nextAvailableWorksheetInSource(queue.source)

    if (!worksheetFromSource) {
      return
    }

    return this.takeWorksheetService.takeWorksheetInQueue(queue.id, worksheetFromSource.id, byUserOfId)
  }
}
