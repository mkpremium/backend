import { DeepPartial, EntityTarget } from 'typeorm'
import { PostgresRepository } from '../infrastructure/postgres/postgres-repository'
import { Flipper } from './flipper.entity'

export class FlipperRepository extends PostgresRepository<Flipper, Flipper> {
  protected entityToStruct (entity: Flipper): Flipper {
    return entity
  }

  protected getEntityTarget (): EntityTarget<Flipper> {
    return Flipper
  }

  protected structToEntity (struct: Flipper): DeepPartial<Flipper> {
    return struct
  }
}
