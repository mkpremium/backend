import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { Logger } from 'winston'
import { DataSource } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from './couchbase-document.entity'

export type Id = string & { _kind: 'Id' }

export interface Identifiable {
  id: Id
}

export interface SaveDocumentCommand {
  name: 'postgres.save_object_command',
  addOnly: boolean,
  fromCouchbase: string,
  ids: Id[]
}

type Deps = {
  ormDataSource: DataSource
  couchbaseAdapter: CouchbaseAdapter
  logger: Logger
}

export type SaveDocumentsCommandHandler = ReturnType<typeof saveDocumentsCommandHandlerFactory>
export function saveDocumentsCommandHandlerFactory ({ couchbaseAdapter, logger, ormDataSource }: Deps) {
  return async function saveDocumentsCommandHandler (cmd: SaveDocumentCommand) {
    for (const id of cmd.ids) {
      logger.info('Saving couchbase document into postgres', { id })
      try {
        const couchbaseDocumentRepository = ormDataSource.getRepository(CouchbaseDocument)
        if (cmd.addOnly) {
          const existing = await couchbaseDocumentRepository.findOneBy({ id })
          if (existing) {
            logger.info('Couchbase document already exists in postgres, skipping.', { id })
            continue
          }
        }

        const { value: document } = await couchbaseAdapter.get(id) as unknown as {
          value: { _documentType: CouchbaseDocumentType, id: string  } & object
        }
        await couchbaseDocumentRepository.save({
          id: document.id,
          documentType: document._documentType,
          document: document,
          fromCouchbase: cmd.fromCouchbase,
        })
      } catch (e) {
        logger.error('Error saving couchbase document into postgres', { id, error: e.message })
        throw e
      }
    }
  }
}
