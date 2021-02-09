import { takeWorksheet } from '../domain/worksheet'

export class WorksheetQueueActionsService {
  /**
   * @param {WorksheetQueueRepository} worksheetQueueRepository
   * @param {WorksheetRepository} worksheetRepository
   * @param {EventBus} eventBus
   */
  constructor (worksheetQueueRepository, worksheetRepository, eventBus) {
    this.queueRepository = worksheetQueueRepository
    this.worksheetRepository = worksheetRepository
    this.eventBus = eventBus
  }

  async takeWorksheetInQueue (queueId, worksheetId, userId) {
    const queue = await this.queueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const [ queueWithWorksheet, worksheetInQueue ] = takeWorksheet(queue, worksheet, userId)

    await this.worksheetRepository.save(worksheetInQueue)
    await this.queueRepository.save(queueWithWorksheet)
    this.eventBus.publish({ name: 'worksheet.taken', worksheetId, queueId, by: userId })

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
