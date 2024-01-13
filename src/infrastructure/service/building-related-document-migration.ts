import { EntityManager } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'

export abstract class BuildingRelatedDocumentMigration {
  constructor (protected entityManager: EntityManager) {
  }

  protected getBuildingNonMigratedRelatedDocuments (documentType: CouchbaseDocumentType, buildingId: string) {
    return this.entityManager
      .createQueryBuilder(CouchbaseDocument, documentType)
      .where(`${documentType}.document ->> 'buildingId' = :buildingId`, { buildingId })
      .andWhere(`${documentType}.documentType = :documentType`, { documentType: documentType })
      .andWhere(`${documentType}.migratedAt is NULL`)
      .select([ `${documentType}.id`, `${documentType}.document` ])
      .getMany()
  }
}
