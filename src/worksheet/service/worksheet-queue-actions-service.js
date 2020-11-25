import { QueueStatus } from '../models/queue-item'

export class WorksheetQueueActionsService {
  constructor (queueRepository, worksheetRepository) {
    this.queueRepository = queueRepository
    this.worksheetRepository = worksheetRepository
  }

  async takeWorksheetInQueue (queueId, worksheetId, userId) {
    const queue = await this.queueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const queueWithWorksheet = queue.addWorksheet(worksheet, userId, QueueStatus.OPENED)

    await this.worksheetRepository.save(worksheet.addToQueue(queueId))
    await this.queueRepository.save(queueWithWorksheet)

    return this.worksheetRepository.getForCallcenterView(worksheetId)
  }
}
