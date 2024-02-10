import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CallcenterWorksheetService } from './callcenter-worksheet.service'
import { EntityManager } from 'typeorm'
import { Worksheet } from '../worksheet.entity'
import { Caller } from '../../caller/caller.entity'

export class WorksheetQueueActionsService {
  constructor (
    private callcenterWorksheetService: CallcenterWorksheetService,
    private eventBus: EventPublisher,
    private entityManager: EntityManager
  ) {
  }

  async takeWorksheetInQueue (queueId: string, worksheetId: string, userId: string) {
    await this.entityManager.transaction(async entityManager => {
      const caller = await entityManager.findOneByOrFail(Caller, [
        { id: userId },
        { user: { id: userId } }
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

    return this.callcenterWorksheetService.getWorksheetForCallcenterView(worksheetId)
  }
}
