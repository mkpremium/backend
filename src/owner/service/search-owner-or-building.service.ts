import { EntityManager, In } from 'typeorm'
import type { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { FoundOwner, FoundOwnerProps } from '../repository/owner.repository'
import { Building } from '../../building/building.entity'
import { ownerEntityToStruct } from '../repository/postgres-owners.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'
import { Owner } from '../owner.entity'
import { BuildingProps } from '../../building/building'
import { mapBuildingEntityToStruct } from '../../building/repository/postgres-buildings.repository'
import { ScheduledEvent } from '../../scheduled-events/scheduled-event.entity'
import { getLastOfferRequestForBuildings, LastBuildingOffer } from '../../building/service/list-buildings.service'
import {
  LastBuildingMeeting,
  PostgresScheduledEventsRepository
} from '../../scheduled-events/repository/postgres-schedule-events.repository'
import { utc } from '../../lib/date'

export class SearchOwnerOrBuildingService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository,
    private entityManager: EntityManager,
    private usePostgres: boolean,
    private postgresScheduledEventsRepository: PostgresScheduledEventsRepository
  ) {
  }

  search (phoneNumber: string): Promise<FoundOwnerProps[]> {
    return this.usePostgres
      ? this.searchByPhoneInPostgres(phoneNumber)
      : this.couchbaseOwnersRepository.findByPhoneNumber(phoneNumber)
  }

  private async searchByPhoneInPostgres (phoneNumber: string): Promise<FoundOwnerProps[]> {
    const result = await this.entityManager.find(Owner, {
      where: {
        person: {
          contacts: {
            contact: {
              value: phoneNumber,
              type: In(['TELEFONO', 'MOVIL'])
            }
          }
        }
      },
      relations: {
        person: {
          contacts: {
            contact: true
          }
        },
        building: true
      }
    })
    if (result.length === 0) {
      return []
    }

    const mappedBuildings = await this.getBuildingsInformation(result)

    return fromJSON(result.map(foundOwner => {
      const matchingContactIdx = foundOwner.person.contacts.findIndex(cp => cp.contact.value === phoneNumber)
      const owner = ownerEntityToStruct(foundOwner)
      const { contacts } = owner.person
      delete owner.person
      const { building, lastOfferRequest, lastMeeting, scheduledCalls } = mappedBuildings[owner.buildingId]

      return {
        ...owner,
        contacts,
        building,
        worksheetId: building.worksheetId,
        negotiationStatus: building.negotiationStatus ?? 'PENDIENTE',
        matchingContactId: foundOwner.person.contacts[matchingContactIdx].contact.id,
        scheduledCalls: scheduledCalls.filter(se => (se.building as unknown as string) === building.id)
          .map(se => ({ at: se.scheduledFor.toISOString() })),
        lastEvent: inferBuildingLastEvent(lastOfferRequest, lastMeeting)
      } as FoundOwnerProps
    }), t.list(FoundOwner))
  }

  private async getBuildingsInformation (owners: Owner[]): Promise<Record<string, {
    building: BuildingProps & { worksheetId: string },
    lastOfferRequest?: LastBuildingOffer,
    lastMeeting?: LastBuildingMeeting,
    scheduledCalls: ScheduledEvent[]
  }>> {
    const buildingIds = owners.map(fo => fo.building.id)
    const [buildings, scheduledCalls, lastBuildingsOfferRequests, lastMeetings] = await Promise.all([
      this.entityManager.find(Building, {
        where: {
          id: In(buildingIds)
        },
        // Same as in PostgresBuildingsRepository#relations plus worksheet
        relations: {
          assignedFlipper: true,
          featuredOwner: true,
          documents: true,
          proposals: true,
          worksheet: true
        }
      }),
      this.entityManager.find(ScheduledEvent, {
        where: { building: { id: In(buildingIds) } },
        loadRelationIds: true
      }),
      getLastOfferRequestForBuildings(buildingIds, this.entityManager),
      this.postgresScheduledEventsRepository.lastMeetingForBuildings(buildingIds)
    ])

    return buildings.reduce((acc, b) => {
      acc[b.id] = {
        building: { ...mapBuildingEntityToStruct(b), worksheetId: b.worksheet.id },
        lastOfferRequest: lastBuildingsOfferRequests.find((offer) => offer.buildingId === b.id),
        lastMeeting: lastMeetings.find((meeting) => meeting.buildingId === b.id),
        scheduledCalls: scheduledCalls.filter(se => (se.building as unknown as string) === b.id)
      }
      return acc
    }, {})
  }
}

function inferBuildingLastEvent (
  lastOfferRequest?: LastBuildingOffer,
  lastMeeting?: LastBuildingMeeting
): FoundOwnerProps['lastEvent'] | undefined {
  if (!lastMeeting) {
    return lastOfferRequest ? lastOfferAsLastEvent(lastOfferRequest) : undefined
  }
  if (!lastOfferRequest) {
    return lastMeetingAsLastEvent(lastMeeting)
  }

  const meetingUtc = utc(lastMeeting.meeting_scheduledFor)
  const offerRequestUTC = utc(lastOfferRequest.offer_createdAt)
  if (meetingUtc.isAfter(offerRequestUTC)) {
    return lastMeetingAsLastEvent(lastMeeting)
  } else {
    return lastOfferAsLastEvent(lastOfferRequest)
  }
}

function lastOfferAsLastEvent (lastOfferRequest: LastBuildingOffer) {
  return {
    eventDate: lastOfferRequest.offer_createdAt.toISOString(),
    ownerId: lastOfferRequest.ownerId,
    flipperName: '',
    type: 'offer-request'
  } as FoundOwnerProps['lastEvent']
}

function lastMeetingAsLastEvent (lastMeeting: LastBuildingMeeting) {
  return {
    eventDate: lastMeeting.meeting_scheduledFor.toISOString(),
    flipperName: '',
    ownerId: lastMeeting.ownerId,
    type: 'meeting'
  } as FoundOwnerProps['lastEvent']
}
