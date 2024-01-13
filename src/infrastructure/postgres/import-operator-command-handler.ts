import { EntityManager } from 'typeorm'
import { Logger } from 'winston'
import { EventPublisher } from '../event-bus'
import { AddOperatorCommand, AddOperatorService } from '../../user/service/add-operator.service'
import { getCouchbaseDocument, markCouchbaseDocumentAsMigrated } from './get-couchbase-document'

interface Deps {
  entityManager: EntityManager,
  logger: Logger,
  eventBus: EventPublisher,
  addOperatorService: AddOperatorService
}

export function importOperatorCommandHandler ({ logger, addOperatorService, entityManager }: Deps) {
  return async function ({ operator }: { operator: AddOperatorCommand & { id: string } }) {
    logger.info('Importing operator', { operator })
    const couchbaseDocument = await getCouchbaseDocument(entityManager, operator.id)
    if (couchbaseDocument.migratedAt) {
      logger.warning('Operator already migrated', { operatorId: operator.id })
      return
    }

    await addOperatorService.addOperator(operator, { id: 'operator-importer' })
    await markCouchbaseDocumentAsMigrated(entityManager, operator.id)
  }
}
