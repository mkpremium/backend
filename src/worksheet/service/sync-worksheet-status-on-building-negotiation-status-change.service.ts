import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { Logger } from 'winston'
import { BuildingsRepository } from '../../building/repository/buildings.repository'
import _some from 'lodash/some'
import { OwnerStatus } from '../../owner/owner'
import { setStatus, WorkSheetStatus } from '../domain/worksheet'
import _every from 'lodash/every'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { ScheduledEventsRepository } from '../../scheduled-events/repository/schedule-events.repository'
import { ScheduledEventType } from '../../scheduled-events/types'
import {
  CouchbaseScheduledEventsRepository
} from '../../scheduled-events/repository/couchbase-schedule-events.repository'

export class SyncWorksheetStatusOnBuildingNegotiationStatusChangeService {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private buildingsRepository: BuildingsRepository,
    private ownersRepository: OwnerRepository,
    private couchbaseScheduledEventsRepository: CouchbaseScheduledEventsRepository,
  ) {
  }

  async updateWorksheet ({ buildingId }: Pick<BuildingNegotiationStatusChanged, 'buildingId' | 'userId'>) {
    const worksheet = await this.worksheetRepository.ofBuildingId(buildingId)
    const building = await this.buildingsRepository.get(buildingId)
    const owners = await this.ownersRepository.buildingOwners(buildingId)
    const newStatus = await this.calculateFixedStatus({ worksheet, building, owners })
    const updatedWorksheet = setStatus(worksheet, newStatus)

    await this.worksheetRepository.save(updatedWorksheet)
  }

  private async calculateFixedStatus ({ building: relatedBuilding, worksheet, owners }) {
    if (relatedBuilding.negotiationStatus) {
      return mapNegotiationStatusToWorksheetStatus(relatedBuilding.negotiationStatus)
    }

    const ownersStatus = (owners || []).map(owner => ({
        status: owner.status,
        isConfirmedByOperator: !!owner.confirmedByOperator.value
      })
    )

    switch (true) {
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.PUBLIC):
        return WorkSheetStatus.PUBLIC
      case _every(ownersStatus, ({ status }) => [
        OwnerStatus.ERROR,
        OwnerStatus.WITHOUT_CONTACT,
        OwnerStatus.WITHOUT_PHONE_CONTACT ].includes(status)):
        return WorkSheetStatus.INVALID
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.VERIFIED):
        return WorkSheetStatus.AVAILABLE
      default:
        const meetings = await this.findMeetings(worksheet.id)
        if (meetings.length > 0) {
          return WorkSheetStatus.MEETING
        }

        return worksheet.status
    }
  }

  private async findMeetings (worksheetId: string) {
    const qb = this.couchbaseScheduledEventsRepository.getQueryBuilder()
    qb.where('type = ?', ScheduledEventType.MEETINGS)
    qb.where('event.worksheetId = ?', worksheetId)
    return this.couchbaseScheduledEventsRepository.query(qb)
  }
}

function mapNegotiationStatusToWorksheetStatus (negotiationStatus) {
  switch (negotiationStatus) {
    case 'DESCARTADO':
      return WorkSheetStatus.PUBLIC
    case 'NO VENDE':
      return WorkSheetStatus.NO_SALE
    case 'YA VENDIO':
      return WorkSheetStatus.ALREADY_SOLD
    case 'VENDIDO':
      return WorkSheetStatus.INVALID
    default:
      return WorkSheetStatus.MEETING
  }
}
