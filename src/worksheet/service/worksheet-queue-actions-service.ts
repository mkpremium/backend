import { takeWorksheet } from '../domain/worksheet'
import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { removeScheduledCall } from '../domain/queue'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

export class WorksheetQueueActionsService {
  constructor (
    private worksheetQueueRepository: WorksheetQueueRepository,
    private worksheetRepository: WorksheetRepository,
    private eventBus: EventPublisher,
  ) {
  }

  async takeWorksheetInQueue (queueId, worksheetId, userId) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const [ queueWithWorksheet, worksheetInQueue ] = takeWorksheet(queue, worksheet, userId)

    await this.worksheetRepository.save(worksheetInQueue)
    await this.worksheetQueueRepository.save(queueWithWorksheet)
    await this.eventBus.publish({ name: DomainEventCatalog.WORKSHEET__TAKEN, worksheetId, queueId, by: userId })

    return this.worksheetRepository.getForCallcenterView(worksheetId)
  }

  async removeScheduledCallFromWorksheets (scheduledCallId) {
    return this.worksheetQueueRepository.findQueueWithScheduledCallOfId(scheduledCallId)
      .then(queue => {
        if (!queue) {
          return
        }

        return this.worksheetQueueRepository.save(removeScheduledCall(queue, scheduledCallId))
      })
  }
}
