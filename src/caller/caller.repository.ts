import { WithPostgresRepository } from '../infrastructure/postgres/postgres-repository'
import { Caller } from './caller.entity'
import { EntityTarget } from 'typeorm'

export class CallerRepository extends WithPostgresRepository<Caller> {
  protected getEntityTarget (): EntityTarget<Caller> {
    return Caller
  }

  async save (c: Caller) {
    return this.repository.save(c)
  }
}
