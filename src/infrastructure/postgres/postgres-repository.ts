import { Repository as EntityRepository } from '../../db/repository'
import { DataSource, DeepPartial, EntityManager, EntityTarget, FindOptionsRelations, Repository } from 'typeorm'
import { EntityNotFound } from '../../db/errors'

export abstract class WithPostgresRepository<E extends { id: string }> {
  protected repository: Repository<E>
  protected entityManager: EntityManager

  constructor (ormDataSource: DataSource) {
    this.repository = ormDataSource.getRepository(this.getEntityTarget())
    this.entityManager = ormDataSource.manager
  }

  protected abstract getEntityTarget (): EntityTarget<E>
}

export abstract class PostgresRepository<S extends { id?: string }, E extends {
  id: string
}> extends WithPostgresRepository<E> implements EntityRepository<S> {
  protected relations: FindOptionsRelations<E> | string[] = {}

  async get (id: string): Promise<S> {
    const entity = await this.repository.findOne({
      where: {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        id: id as any
      },
      relations: this.relations
    })
    if (entity === null) {
      throw new EntityNotFound(id)
    }

    return this.entityToStruct(entity)
  }

  save (struct: S): Promise<S> {
    return this.repository
      .save(this.structToEntity(struct))
      .then(savedEntity => {
        if (!struct.id) {
          return {
            ...struct,
            id: savedEntity.id
          }
        }

        return struct
      })
  }

  protected abstract structToEntity (struct: S): DeepPartial<E>

  protected abstract entityToStruct (entity: E): S
}
