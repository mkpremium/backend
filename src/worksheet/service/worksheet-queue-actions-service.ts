import { takeWorksheet } from '../domain/worksheet'
import { EventPublisher } from '../../infrastructure/event-bus'
import { removeScheduledCall } from '../domain/queue'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CallcenterWorksheetService } from './callcenter-worksheet.service'
import { CouchbaseWorksheetQueueRepository } from '../repository/couchbase-worksheet-queue.repository'
import { EntityManager } from 'typeorm'
import { Worksheet } from '../worksheet.entity'
import { Caller } from '../../caller/caller.entity'
import { CouchbaseWorksheetRepository } from '../repository/couchbase-worksheet.repository'

export class WorksheetQueueActionsService {
  constructor (
    private couchbaseWorksheetQueueRepository: CouchbaseWorksheetQueueRepository,
    private couchbaseWorksheetRepository: CouchbaseWorksheetRepository,
    private callcenterWorksheetService: CallcenterWorksheetService,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async takeWorksheetInQueue (queueId: string, worksheetId: string, userId: string) {
    if (this.usePostgres) {
      await this.doPostgres(queueId, worksheetId, userId)
    } else {
      await this.doCouchbase(queueId, worksheetId, userId)
    }

    return this.callcenterWorksheetService.getWorksheetForCallcenterView(worksheetId)
  }

  private async doCouchbase (queueId: string, worksheetId: string, userId: string) {
    const queue = await this.couchbaseWorksheetQueueRepository.get(queueId)
    const worksheet = await this.couchbaseWorksheetRepository.get(worksheetId)

    const [queueWithWorksheet, worksheetInQueue] = takeWorksheet(queue, worksheet, userId)

    await this.couchbaseWorksheetRepository.save(worksheetInQueue)
    await this.couchbaseWorksheetQueueRepository.save(queueWithWorksheet)
    await this.eventBus.publish({ name: DomainEventCatalog.WORKSHEET__TAKEN, worksheetId, queueId, by: userId })
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

  private doPostgres (queueId: string, worksheetId: string, userOrCallerId: string) {
    return this.entityManager.transaction(async entityManager => {
      const caller = await entityManager.findOneByOrFail(Caller, [
        { id: userOrCallerId },
        { user: { id: userOrCallerId } }
      ])
      await entityManager.update(Worksheet, { id: worksheetId }, {
        status: 'TAKEN',
        queue: { id: queueId },
        heldBy: { id: caller.id },
        lastViewedAt: new Date(),
        lastStatusChangedAt: new Date()
      })
      await this.eventBus.publish({
        name: DomainEventCatalog.WORKSHEET__TAKEN,
        worksheetId,
        queueId,
        by: caller.id
      }, entityManager)
    })
  }
}
