export class WorksheetQueueActionsService {
  /**
   * @param {WorksheetQueueRepository} queueRepository
   * @param {WorksheetRepository} worksheetRepository
   */
  constructor (queueRepository, worksheetRepository) {
    this.queueRepository = queueRepository
    this.worksheetRepository = worksheetRepository
  }

  async takeWorksheetInQueue (queueId, worksheetId, userId) {
    const queue = await this.queueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const [ queueWithWorksheet, worksheetInQueue ] = queue.takeWorksheet(worksheet, userId)

    await this.worksheetRepository.save(worksheetInQueue)
    await this.queueRepository.save(queueWithWorksheet)

    return this.worksheetRepository.getForCallcenterView(worksheetId)
  }

  async removeScheduledCallFromWorksheets (scheduledCallId) {
    const queue = await this.queueRepository.findQueueWithScheduledCallOfId(scheduledCallId)
    if (!queue) {
      return
    }

    const queueWithoutScheduledCall = queue.removeScheduledCall(scheduledCallId)

    return this.worksheetRepository.save(queueWithoutScheduledCall)
  }
}
