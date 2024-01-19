import { takeWorksheet } from '../domain/worksheet'
import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { removeScheduledCall } from '../domain/queue'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CallcenterWorksheetService } from './callcenter-worksheet.service'
import { CouchbaseWorksheetQueueRepository } from "../repository/couchbase-worksheet-queue.repository";

export class WorksheetQueueActionsService {
  constructor (
    private worksheetQueueRepository: WorksheetQueueRepository,
    private couchbaseWorksheetQueueRepository: CouchbaseWorksheetQueueRepository,
    private worksheetRepository: WorksheetRepository,
    private callcenterWorksheetService: CallcenterWorksheetService,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
  ) {
  }

  async takeWorksheetInQueue (queueId: string, worksheetId: string, userId: string) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    const worksheet = await this.worksheetRepository.get(worksheetId)

    const [ queueWithWorksheet, worksheetInQueue ] = takeWorksheet(queue, worksheet, userId)

    await this.worksheetRepository.save(worksheetInQueue)
    // As we use the worksheet as source for the queue in Postgres there is no need to update the queue.
    if (!this.usePostgres) {
      await this.couchbaseWorksheetQueueRepository.save(queueWithWorksheet)
    }
    await this.eventBus.publish({ name: DomainEventCatalog.WORKSHEET__TAKEN, worksheetId, queueId, by: userId })

    return this.callcenterWorksheetService.getWorksheetForCallcenterView(worksheetId)
  }

  async removeScheduledCallFromWorksheets (scheduledCallId: string) {
    // As we use the worksheet as source for the queue in Postgres there is no need to update the queue.
    if (this.usePostgres) {
      return
    }

    return this.couchbaseWorksheetQueueRepository.findQueueWithScheduledCallOfId(scheduledCallId)
      .then(queue => {
        if (!queue) {
          return
        }

        this.couchbaseWorksheetQueueRepository.save(removeScheduledCall(queue, scheduledCallId))
      })
  }
}
