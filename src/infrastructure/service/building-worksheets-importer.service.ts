import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { Caller } from '../../caller/caller.entity'
import { EventPublisher } from '../event-bus'
import { EntityManager } from 'typeorm'
import { Logger } from 'winston'
import { BuildingRelatedDocumentMigration } from './building-related-document-migration'
import { WorksheetProps } from '../../worksheet/domain/worksheet'
import { Worksheet } from '../../worksheet/worksheet.entity'
import { structToEntity } from '../../worksheet/repository/postgres-worksheet.repository'
import { markCouchbaseDocumentAsMigrated } from '../postgres/get-couchbase-document'

export class BuildingWorkSheetsImporterService extends BuildingRelatedDocumentMigration {
  constructor (
    private readonly eventBus: EventPublisher,
    entityManager: EntityManager,
    private readonly logger: Logger,
  ) {
    super(entityManager)
  }

  async importWorkSheets(buildingId: string) {
    this.logger.info('Building imported, importing its worksheets', { buildingId })
    const worksheet = await this.getDocumentByRelatedBuildingId(
      CouchbaseDocumentType.WORKSHEET, buildingId)

    const original = worksheet.document as WorksheetProps

    if (!worksheet) {
      this.logger.info('No worksheets found for building', { buildingId })
      return
    }

    // Find the worksheet queue.
    const queue = await this.getNonMigratedDocumentById(
      CouchbaseDocumentType.WORKSHEET_QUEUE, original.queueId)

    let operatorId = null
    for (const worksheet of queue.document["worksheets"]) {
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
    })

    // TODO: implement
    await this.eventBus.publish({
      name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_WORKSHEET,
      buildingId,
    })
  }
}
