import { WorksheetQueueProps } from '../domain/queue'
import { WorksheetQueueRepository } from './worksheet-queue.repository'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { WorksheetQueue } from '../worksheet-queue.entity'
import { DeepPartial, EntityTarget } from 'typeorm'
import { BaseEntity } from '../../infrastructure/entity'

export class PostgresWorksheetQueueRepository extends PostgresRepository<WorksheetQueueProps & Partial<BaseEntity>, WorksheetQueue>
  implements WorksheetQueueRepository {
  relations = {
    worksheets: true,
  }

  findQueueWithScheduledCallOfId (scheduledCallId: string): Promise<WorksheetQueueProps & BaseEntity> {
    throw new Error('Method not implemented.')
  }

  list (): Promise<WorksheetQueueProps[]> {
    throw new Error('Method not implemented.')
  }

  protected structToEntity (struct: WorksheetQueueProps & Partial<BaseEntity>): DeepPartial<WorksheetQueue> {
    return {
      id: struct.id,
      name: struct.name,
      worksheets: struct.worksheets,
      source: struct.source,
      createdAt: struct.createdAt,
      updatedAt: struct.updatedAt,
    }
  }

  protected entityToStruct (entity: WorksheetQueue): WorksheetQueueProps {
    return {
      id: entity.id,
      name: entity.name,
      source: entity.source,
      worksheets: entity.worksheets,
    }
  }

  protected getEntityTarget (): EntityTarget<WorksheetQueue> {
    return WorksheetQueue
  }
}
