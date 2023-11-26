import { PrismaClient } from '@prisma/client'
import uuid from 'uuid/v4'

export class EventsRepository {
  constructor (private prismaClient: PrismaClient) {
  }

  async saveEvent (event: { name: string } & unknown) {
    await this.prismaClient.domainEvent.create({
      data: {
        id: uuid(),
        name: event.name,
        body: event
      }
    })
  }
}
