import { Prisma, PrismaClient } from '@prisma/client'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { Logger } from 'winston'

export type Id = string & { _kind: 'Id' }

export interface Identifiable {
  id: Id
}

export type CouchbaseDocument = Identifiable & { _documentType: string } & object

export interface SaveDocumentCommand {
  name: 'postgres.save_object_command',
  ids: Id[]
}

type Deps = {
  prismaClient: PrismaClient
  couchbaseAdapter: CouchbaseAdapter
  logger: Logger
}

export function saveDocumentsCommandHandler ({ couchbaseAdapter, logger, prismaClient }: Deps) {
  return async function (cmd: SaveDocumentCommand) {
    for (const id of cmd.ids) {
      logger.info('Saving couchbase document into postgres', { id })
      try {
        const { value: document } = await couchbaseAdapter.get(id) as unknown as { value: CouchbaseDocument }
        await prismaClient.couchbaseDocument.create({
          data: {
            id: document.id,
            documentType: document._documentType,
            document: document
          }
        })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          logger.warning("Document already exist", {id})
          continue
        }
        logger.error('Error saving couchbase document into postgres', { id, error: e.message })
        throw e
      }
    }
  }
}
