import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'
import _some from 'lodash/some'
import { OwnerStatus } from '../../owner/owner'
import { setStatus, WorkSheetStatus, WorksheetStatusType } from '../domain/worksheet'
import _every from 'lodash/every'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { BuildingsRepository } from '../../building/repository/buildings.repository'
import type { EntityManager } from 'typeorm'
import { ScheduledEvent } from '../../scheduled-events/scheduled-event.entity'
import type { BuildingNegotiationStatus } from '../../building/building'

export class SyncWorksheetStatusOnBuildingNegotiationStatusChangeService {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private buildingsRepository: BuildingsRepository,
    private ownersRepository: OwnerRepository,
    private entityManager: EntityManager
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
      return mapNegotiationStatusToWorksheetStatus(relatedBuilding.negotiationStatus, relatedBuilding.assignedAgentId)
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
      OwnerStatus.WITHOUT_PHONE_CONTACT].includes(status)):
      return WorkSheetStatus.INVALID
    case _some(ownersStatus,
      ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.VERIFIED):
      return WorkSheetStatus.AVAILABLE
    default:
      // eslint-disable-next-line no-case-declarations
      const meetings = await this.findMeetings(worksheet.id)
      if (meetings.length > 0) {
        return WorkSheetStatus.MEETING
      }

      return worksheet.status
    }
  }

  private async findMeetings (worksheetId: string) {
    return this.entityManager.find(ScheduledEvent, {
      where: {
        type: 'MEETING',
        building: {
          worksheet: {
            id: worksheetId
          }
        }
      }
    })
  }
}

export function mapNegotiationStatusToWorksheetStatus (negotiationStatus: BuildingNegotiationStatus, assignedFlipperId: string): WorksheetStatusType {
  switch (negotiationStatus) {
  case 'DESCARTADO':
    return 'ENTE_PUBLICO'
  case 'NO VENDE':
    return 'NO_SALE'
  case 'YA VENDIO':
    return 'YA_VENDIO'
  case 'VENDIDO':
    return 'INVALID'
  case 'PENDIENTE':
    return assignedFlipperId ? 'MEETING' : 'LOOKING_MEETING'
  case 'COMPRADO':
    return 'YA_VENDIO'
  case 'LEAD':
  case 'PROPOSAL_SCHEDULED':
  case 'PROPUESTA ENVIADA':
    return 'MEETING'
  }
}
