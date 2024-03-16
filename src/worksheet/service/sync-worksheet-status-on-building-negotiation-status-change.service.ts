import { BuildingNegotiationStatusChanged } from '../../building/service/update-building-negotiation-status.service'
import { setStatus, WorksheetStatusType } from '../domain/worksheet'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { BuildingsRepository } from '../../building/repository/buildings.repository'
import type { BuildingNegotiationStatus, BuildingProps } from '../../building/building'

export class SyncWorksheetStatusOnBuildingNegotiationStatusChangeService {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private buildingsRepository: BuildingsRepository
  ) {
  }

  async updateWorksheet ({ buildingId }: Pick<BuildingNegotiationStatusChanged, 'buildingId' | 'userId'>) {
    const worksheet = await this.worksheetRepository.ofBuildingId(buildingId)
    const building = await this.buildingsRepository.get(buildingId)
    const newStatus = await this.calculateFixedStatus(building)
    const updatedWorksheet = setStatus(worksheet, newStatus)

    await this.worksheetRepository.save(updatedWorksheet)
  }

  private async calculateFixedStatus (relatedBuilding: BuildingProps) {
    if (!relatedBuilding.negotiationStatus) {
      throw new Error(`Building has no negotiation status: ${relatedBuilding.id}`)
    }
    return mapNegotiationStatusToWorksheetStatus(relatedBuilding.negotiationStatus, relatedBuilding.assignedAgentId)
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
    return 'VENDIDO'
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
