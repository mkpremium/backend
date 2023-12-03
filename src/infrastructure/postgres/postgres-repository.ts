import { Repository as EntityRepository } from '../../db/repository'
import { DataSource, DeepPartial, EntityTarget, Repository } from 'typeorm'

export abstract class WithPostgresRepository<E> {
  protected repository: Repository<E>

  constructor (ormDataSource: DataSource) {
    this.repository = ormDataSource.getRepository(this.getEntityTarget())
  }

  protected abstract getEntityTarget (): EntityTarget<E>
}

export abstract class PostgresRepository<S extends { id: string }, E extends {
  id: string
}> extends WithPostgresRepository<E> implements EntityRepository<S> {
  get (id: string): Promise<S> {
    return Promise.reject(new Error('Not implemented'))
  }

  save (struct: S): Promise<S> {
    return this.repository
      .save(this.structToEntity(struct))
      .then(savedEntity => {
        if (!struct.id) {
          struct[ 'id' ] = savedEntity.id
        }

        return struct
      })
  }

  protected abstract structToEntity (struct: S): DeepPartial<E>

  protected abstract entityToStruct (entity: E): S
}
