import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { WorksheetProps } from '../domain/worksheet'
import { Worksheet } from '../worksheet.entity'
import { DeepPartial, EntityTarget } from 'typeorm'

export class PostgresWorksheetRepository extends PostgresRepository<WorksheetProps, Worksheet> {
  protected entityToStruct (entity: Worksheet): WorksheetProps {
    throw new Error('Not implemented')
  }

  protected getEntityTarget (): EntityTarget<Worksheet> {
    return Worksheet
  }

  protected structToEntity (struct: WorksheetProps): DeepPartial<Worksheet> {
    return this.repository.create({
      id: struct.id,
      status: struct.status,
      lastStatusChangedAt: struct.statusChangedAt,
      statusChangeReason: struct.statusChangeReason,
      lastViewedAt: struct.viewedAt,
      lastViewedBy: struct.viewedBy ? { id: struct.viewedBy } : null,
      building: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      queue: struct.queueId ? { id: struct.queueId } : null,
    })
  }
}
