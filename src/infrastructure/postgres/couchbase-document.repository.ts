import { CouchbaseDocument, CouchbaseDocumentType } from "./couchbase-document.entity";
import { EntityManager } from "typeorm";

export class CouchbaseDocumentRepository {
  constructor(private entityManager: EntityManager) {
  }

  getBuildingNonMigratedRelatedDocuments(documentType: CouchbaseDocumentType, buildingId: string) {
    return this.getNonMigratedQuery(documentType)
      .andWhere(`${documentType}.document ->> 'buildingId' = :buildingId`, {buildingId})
      .getMany()
  }

  getDocumentByRelatedBuildingId(documentType: CouchbaseDocumentType, buildingId: string) {
    return this.getNonMigratedQuery(documentType)
      // For some reason using placeholders here doesn't work, so I'm using
      // string concatenation.
      .andWhere(`${documentType}.document -> 'relatedBuildingIds' @> '"` + buildingId + `"'`)
      .getOne()
  }

  getNonMigratedDocumentById(documentType: CouchbaseDocumentType, id: string) {
    return this.entityManager
      .createQueryBuilder(CouchbaseDocument, documentType)
      .where(`id = :id`, {id})
      .getOne()
  }

  getNonMigratedQuery(documentType: CouchbaseDocumentType) {
    return this.entityManager
      .createQueryBuilder(CouchbaseDocument, documentType)
      .andWhere(`${documentType}.documentType = :documentType`, {documentType: documentType})
      .andWhere(`${documentType}.migratedAt is NULL`)
      .select([`${documentType}.id`, `${documentType}.document`])
  }
}
