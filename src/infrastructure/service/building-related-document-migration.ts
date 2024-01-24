import { EntityManager } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'

export abstract class BuildingRelatedDocumentMigration {
  constructor (protected entityManager: EntityManager) {
  }

  private getNonMigratedQuery( documentType: CouchbaseDocumentType ) {
    return this.entityManager
      .createQueryBuilder(CouchbaseDocument, documentType)
      .andWhere(`${documentType}.documentType = :documentType`, { documentType: documentType })
      .andWhere(`${documentType}.migratedAt is NULL`)
      .select([ `${documentType}.id`, `${documentType}.document` ])
  }

  protected getBuildingNonMigratedRelatedDocuments (documentType: CouchbaseDocumentType, buildingId: string) {
    return this.getNonMigratedQuery(documentType)
      .andWhere(`${documentType}.document ->> 'buildingId' = :buildingId`, { buildingId })
      .getMany()
  }

  protected getDocumentByRelatedBuildingId (documentType: CouchbaseDocumentType, buildingId: string) {
    return this.getNonMigratedQuery(documentType)
      // For some reason using placeholders here doesn't work, so I'm using
      // string concatenation.
      .andWhere(`${documentType}.document -> 'relatedBuildingIds' @> '"` + buildingId + `"'`)
      .getOne()
  }

  protected getNonMigratedDocumentById(documentType: CouchbaseDocumentType, id: string) {
    return this.entityManager
      .createQueryBuilder(CouchbaseDocument, documentType)
      .where(`id = :id`, { id })
      .getOne()
  }
}
