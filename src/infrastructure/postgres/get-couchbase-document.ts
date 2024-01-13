import { EntityManager } from 'typeorm'
import { CouchbaseDocument } from './couchbase-document.entity'

export function getCouchbaseDocument (entityManager: EntityManager, documentId: string) {
  return entityManager.findOneBy(CouchbaseDocument, { id: documentId })
}

export function markCouchbaseDocumentAsMigrated (entityManager: EntityManager, documentId: string) {
  return entityManager.update(CouchbaseDocument, { id: documentId }, { migratedAt: new Date() })
}
