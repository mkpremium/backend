import { BuildingProps } from '../../building/building'
import { ContactProps } from '../../owner/owner'
import { EntityManager } from 'typeorm'
import { mapBuildingEntityToStruct } from '../../building/repository/postgres-buildings.repository'
import { ScheduledEvent } from '../scheduled-event.entity'

export class ScheduledCallsService {
  constructor (
    private entityManager: EntityManager
  ) {
  }

  async scheduledCallsFor (userId: string): Promise<ScheduledCallsView[]> {
    return PostgresScheduledCallsService.scheduledCallsFor(this.entityManager, userId)
  }

  async getById (callId: string): Promise<ScheduledCallsView> {
    return PostgresScheduledCallsService.getById(this.entityManager, callId)
  }
}

class PostgresScheduledCallsService {
  static async scheduledCallsFor (entityManager: EntityManager, userId: string): Promise<ScheduledCallsView[]> {
    const scheduledEvents = await entityManager.find(ScheduledEvent, {
      where: {
        type: 'CALL' as const,
        notifyTo: {
          id: userId
        }
      },
      relations: this.relations
    })

    return scheduledEvents.map(mapScheduledEventToScheduledCall)
  }

  static async getById (entityManager: EntityManager, callId: string): Promise<ScheduledCallsView> {
    const scheduledEvent = await entityManager.findOneOrFail(ScheduledEvent, {
      where: { id: callId, type: 'CALL' as const },
      relations: this.relations
    })
    return mapScheduledEventToScheduledCall(scheduledEvent)
  }

  private static relations = {
    building: {
      worksheet: true,
      documents: true
    },
    contact: true,
    createdBy: true,
    owner: {
      person: {
        contacts: {
          contact: true
        }
      }
    }
  }
}

function mapScheduledEventToScheduledCall (scheduledEvent: ScheduledEvent): ScheduledCallsView {
  return {
    id: scheduledEvent.id,
    createdBy: scheduledEvent.createdBy.id,
    eventDate: scheduledEvent.scheduledFor,
    event: {
      worksheetId: scheduledEvent.building.worksheet.id,
      buildingId: scheduledEvent.building.id,
      contactId: scheduledEvent.contact.id,
      owner: {
        id: scheduledEvent.owner.id,
        building: mapBuildingEntityToStruct(scheduledEvent.building),
        person: {
          name: scheduledEvent.owner.person.fullName,
          contacts: scheduledEvent.owner.person.contacts.map(cp => ({ ...cp.contact, status: cp.status }))
        }
      }
    }
  }
}

interface ScheduledCallsView {
  id: string
  createdBy: string
  eventDate: Date
  event: {
    buildingId: string
    worksheetId: string
    contactId: string
    owner: {
      id: string
      building: BuildingProps
      person: {
        name: string,
        contacts: ContactProps[]
      }
    }
  }
}
