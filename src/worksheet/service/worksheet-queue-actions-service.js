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
    return this.queueRepository.findQueueWithScheduledCallOfId(scheduledCallId)
      .then(queue => {
        if (!queue) {
          return
        }

        return this.queueRepository.save(queue.removeScheduledCall(scheduledCallId))
      })
  }
}
