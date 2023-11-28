import { PrismaClient } from '@prisma/client'
import uuid from 'uuid/v4'

export type DomainEvent = { name: string } & unknown

export class EventsRepository {
  constructor (private prismaClient: PrismaClient) {
  }

  async saveEvent (event: DomainEvent) {
    await this.prismaClient.domainEvent.create({
      data: {
        id: uuid(),
        name: event.name,
        version: 'legacy',
        body: event
      }
    })
  }
}
