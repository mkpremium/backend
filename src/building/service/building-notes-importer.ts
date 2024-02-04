import { Logger } from 'winston'
import { BuildingNote } from '../building-note.entity'
import type { EntityManager } from 'typeorm'
import type { CouchbaseDocumentRepository } from '../../infrastructure/postgres/couchbase-document.repository'
import { CouchbaseDocumentType } from '../../infrastructure/postgres/couchbase-document.entity'
import type { Note } from '../../notes/types'

export class BuildingNotesImporterService {
  constructor (
    private readonly entityManager: EntityManager,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository,
    private readonly logger: Logger
  ) {
  }

  async importBuildingNotes (buildingId: string) {
    this.logger.info('Building imported, importing its notes', { buildingId })
    const couchbaseDocuments = await this.couchbaseDocumentRepository.getBuildingNonMigratedRelatedDocuments(CouchbaseDocumentType.NOTE, buildingId)
    this.logger.info('Found notes for building', { buildingId, count: couchbaseDocuments.length })

    for (const couchbaseDocument of couchbaseDocuments) {
      const note = couchbaseDocument.document as Note
      const createdAt = note.createdAt ?? new Date()
      try {
        await this.entityManager.save(BuildingNote, {
          building: { id: note.context.buildingId },
          note: note.note,
          id: note.id,
          createdAt,
          updatedAt: createdAt,
          author: { id: note.createdBy }
        })
        this.logger.info('Building note imported', { buildingId, noteId: couchbaseDocument.id })
      } catch (error) {
        this.logger.error('Error importing note', { buildingId, noteId: couchbaseDocument.id, error })
      }
    }

    this.logger.info('All building notes imported', { buildingId })
  }
}
