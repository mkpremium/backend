import { DataSource } from 'typeorm'
import { DomainEvent } from '../postgres/domain-event.entity'

type PublishedEvent = Pick<DomainEvent, 'name'> & any

export function createEventRecorderListener ({ ormDataSource }: {
  ormDataSource: DataSource
}) {
  return async (event: PublishedEvent) => {
    const repository = ormDataSource.getRepository(DomainEvent)
    await repository.save({
      name: event.name,
      version: event.name || 'unknown',
      body: event,
    })
  }
}
