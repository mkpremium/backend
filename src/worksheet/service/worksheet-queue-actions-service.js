export class WorksheetQueueActionsService {
  /**
   * @param {WorksheetQueueRepository} queueRepository
   * @param {WorksheetRepository} worksheetRepository
   * @param {EventBus} eventbus
   */
  constructor (queueRepository, worksheetRepository, eventbus) {
    this.queueRepository = queueRepository
    this.worksheetRepository = worksheetRepository
    this.eventbus = eventbus
  }

  async takeWorksheetInQueue (queueId, worksheetId, userId) {
    const queue = await this.queueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const [ queueWithWorksheet, worksheetInQueue ] = queue.takeWorksheet(worksheet, userId)

    await this.worksheetRepository.save(worksheetInQueue)
    await this.queueRepository.save(queueWithWorksheet)
    this.eventbus.publish({ name: 'worksheet.taken', worksheetId, queueId, by: userId })

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
