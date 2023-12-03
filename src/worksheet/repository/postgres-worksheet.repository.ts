import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { WorksheetProps } from '../domain/worksheet'
import { Worksheet } from '../worksheet.entity'
import { DeepPartial, EntityTarget } from 'typeorm'

export class PostgresWorksheetRepository extends PostgresRepository<WorksheetProps, Worksheet> {
  protected entityToStruct (entity: Worksheet): WorksheetProps {
    throw new Error('Not implemented')
  }

  protected getEntityTarget (): EntityTarget<Worksheet> {
    throw new Error('Not implemented')
  }

  protected structToEntity (struct: WorksheetProps): DeepPartial<Worksheet> {
    throw new Error('Not implemented')
  }

}
