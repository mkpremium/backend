import { DataSource, EntityManager } from 'typeorm'
import { DomainEvent } from '../postgres/domain-event.entity'

type PublishedEvent = Pick<DomainEvent, 'name'> & unknown

export function createEventRecorderListener ({ ormDataSource }: {
  ormDataSource: DataSource
}) {
  return async (event: PublishedEvent, entityManager?: EntityManager, isTransactional: boolean = false) => {
    await (entityManager ?? ormDataSource.manager).save(DomainEvent, {
      name: event.name,
      version: event.name || 'unknown',
      body: { ...event, _meta: { isTransactional } }
    })
  }
}
