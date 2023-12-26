import { WorksheetQueueProps } from '../domain/queue'
import { WorksheetQueueRepository } from './worksheet-queue.repository'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { WorksheetQueue } from '../worksheet-queue.entity'
import { DeepPartial, EntityTarget } from 'typeorm'

export class PostgresCouchbaseQueueRepository extends PostgresRepository<WorksheetQueueProps, WorksheetQueue>
  implements WorksheetQueueRepository {
  findQueueWithScheduledCallOfId (scheduledCallId: string): Promise<WorksheetQueueProps> {
    throw new Error('Method not implemented.')
  }

  list (): Promise<WorksheetQueueProps[]> {
    throw new Error('Method not implemented.')
  }

  protected structToEntity (struct: WorksheetQueueProps): DeepPartial<WorksheetQueue> {
    throw new Error('Method not implemented.')
  }

  protected entityToStruct (entity: WorksheetQueue): WorksheetQueueProps {
    throw new Error('Method not implemented.')
  }

  protected getEntityTarget (): EntityTarget<WorksheetQueue> {
    return WorksheetQueue
  }
}
