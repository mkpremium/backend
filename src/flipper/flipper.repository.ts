import { DeepPartial, EntityTarget } from 'typeorm'
import { PostgresRepository } from '../infrastructure/postgres/postgres-repository'
import { Flipper } from './flipper.entity'

export class FlipperRepository extends PostgresRepository<Flipper, Flipper> {
  protected target = Flipper
  protected entityToStruct (entity: Flipper): Flipper {
    return entity
  }

  protected structToEntity (struct: Flipper): DeepPartial<Flipper> {
    return struct
  }
}
