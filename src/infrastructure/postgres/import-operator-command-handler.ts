import { DataSource } from 'typeorm'
import { Logger } from 'winston'
import { EventPublisher } from '../event-bus'
import { AddOperatorCommand, AddOperatorService } from '../../user/service/add-operator.service'

interface Deps {
  ormDataSource: DataSource,
  logger: Logger,
  eventBus: EventPublisher,
  addOperatorService: AddOperatorService
}

export function importOperatorCommandHandler ({ logger, addOperatorService }: Deps) {
  return async function ({ operator }: { operator: AddOperatorCommand }) {
    logger.info('Importing operator', { operator })
    await addOperatorService.addOperator(operator, { id: 'operator-importer' })
  }
}
