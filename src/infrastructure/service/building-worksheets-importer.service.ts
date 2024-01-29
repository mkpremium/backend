import { CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { Caller } from '../../caller/caller.entity'
import { EventPublisher } from '../event-bus'
import { EntityManager } from 'typeorm'
import { Logger } from 'winston'
import { WorksheetProps } from '../../worksheet/domain/worksheet'
import { WorksheetQueueProps } from '../../worksheet/domain/queue'
import { Worksheet } from '../../worksheet/worksheet.entity'
import { structToEntity } from '../../worksheet/repository/postgres-worksheet.repository'
import { markCouchbaseDocumentAsMigrated } from '../postgres/get-couchbase-document'
import { CouchbaseDocumentRepository } from "../postgres/couchbase-document.repository";

export class BuildingWorkSheetsImporterService {
  constructor (
    private readonly eventBus: EventPublisher,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository,
  ) {
  }

  async importWorkSheet(buildingId: string) {
    this.logger.info('Building imported, importing its worksheets', { buildingId })
    const worksheet = await this.couchbaseDocumentRepository.getDocumentByRelatedBuildingId(
      CouchbaseDocumentType.WORKSHEET, buildingId)

    const original = worksheet.document as WorksheetProps

    if (!worksheet) {
      this.logger.error('No worksheets found for building', { buildingId })
      return
    }

    // Find the worksheet queue.
    const queue = (await this.couchbaseDocumentRepository.getNonMigratedDocumentById(
      CouchbaseDocumentType.WORKSHEET_QUEUE, original.queueId)).document as WorksheetQueueProps

    let operatorId = null
    let queueItems = queue?.worksheets || []
    for (const worksheet of queueItems) {
      if (worksheet.worksheetId === original.id) {
        operatorId = worksheet.operatorId
        break
      }
    }
    const caller = await this.entityManager.findOne(Caller, {
      where: {user: {id: operatorId}},
    })

    await this.entityManager.transaction(async em => {
      const worksheet = { heldBy: caller, ...structToEntity(original) } as Worksheet
      await em.save(Worksheet, worksheet)
      await markCouchbaseDocumentAsMigrated(em, original.id)
      await this.eventBus.publish({
        name: DomainEventCatalog.POSTGRES_MIGRATION__WORKSHEET_IMPORTED,
        em,
      })
    })

  }
}
