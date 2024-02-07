import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
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
import { CouchbaseDocumentRepository } from '../postgres/couchbase-document.repository'

export class BuildingWorkSheetsImporterService {
  constructor (
    private readonly eventBus: EventPublisher,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository
  ) {
  }

  async importWorkSheet (buildingId: string) {
    this.logger.info('Building imported, importing its worksheets', { buildingId })
    const couchbaseDocument = await this.getCouchbaseWorksheet(buildingId)

    if (!couchbaseDocument) {
      this.logger.error('No worksheets found for building', { buildingId })
      return
    }

    const original = couchbaseDocument.document as WorksheetProps

    const worksheet = structToEntity(original)
    let operatorId = null
    if (original.queueId) {
      // Find the worksheet queue.
      const queue = await this.entityManager
        .createQueryBuilder(CouchbaseDocument, 'queue')
        .andWhere('queue.documentType = :documentType', { documentType: CouchbaseDocumentType.WORKSHEET_QUEUE })
        .andWhere('queue.id = :id', { id: original.queueId })
        .getOne()

      if (queue) {
        const queueItems = (queue.document as WorksheetQueueProps)?.worksheets || []
        for (const worksheet of queueItems) {
          if (worksheet.worksheetId === original.id) {
            operatorId = worksheet.operatorId
            break
          }
        }
      } else {
        this.logger.error('Queue not found', { queueId: original.queueId })
      }

      worksheet.heldBy = await this.entityManager.findOne(Caller, {
        where: { user: { id: operatorId } }
      })
    }

    await this.entityManager.transaction(async em => {
      await em.save(Worksheet, worksheet)
      await markCouchbaseDocumentAsMigrated(em, original.id)
      await this.eventBus.publish({ name: DomainEventCatalog.POSTGRES_MIGRATION__WORKSHEET_IMPORTED }, em)
    })
  }

  private async getCouchbaseWorksheet (buildingId: string): Promise<CouchbaseDocument> {
    let worksheetDocument = await this.couchbaseDocumentRepository.getDocumentByRelatedBuildingId(
      CouchbaseDocumentType.WORKSHEET, buildingId)
    if (!worksheetDocument) {
      worksheetDocument = await this.couchbaseDocumentRepository.getDocumentByRelatedBuildingId(
        CouchbaseDocumentType.WORKSHEET_WO_BUILDINGS, buildingId)
    }

    return worksheetDocument
  }
}
