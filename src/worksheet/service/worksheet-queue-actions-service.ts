import { takeWorksheet } from '../domain/worksheet'
import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { EventBus } from '../../infrastructure/event-bus'
import { WorksheetRepository } from '../repository/worksheet.repository'

export class WorksheetQueueActionsService {
  constructor (
    private worksheetQueueRepository: WorksheetQueueRepository,
    private worksheetRepository: WorksheetRepository,
    private eventBus: EventBus
  ) {
  }

  async takeWorksheetInQueue (queueId, worksheetId, userId) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const [ queueWithWorksheet, worksheetInQueue ] = takeWorksheet(queue, worksheet, userId)

    await this.worksheetRepository.save(worksheetInQueue)
    await this.worksheetQueueRepository.save(queueWithWorksheet)
    this.eventBus.publish({ name: 'worksheet.taken', worksheetId, queueId, by: userId })

    return this.worksheetRepository.getForCallcenterView(worksheetId)
  }

  async removeScheduledCallFromWorksheets (scheduledCallId) {
    return this.worksheetQueueRepository.findQueueWithScheduledCallOfId(scheduledCallId)
      .then(queue => {
        if (!queue) {
          return
        }

        return this.worksheetQueueRepository.save(queue.removeScheduledCall(scheduledCallId))
      })
  }
}
