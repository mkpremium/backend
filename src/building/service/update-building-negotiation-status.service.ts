import { EventPublisher } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../repository/buildings.repository'
import { BuildingNegotiationStatus, changeNegotiationStatus, withFeaturedOwner } from '../building'

export interface BuildingNegotiationStatusChanged {
  name: 'building.negotiation-status-changed';
  buildingId: string;
  userId: string;
  negotiationStatus: BuildingNegotiationStatus;
}

interface UpdateBuildingNegotiationStatusCommand {
  status: BuildingNegotiationStatus;
  userId: string;
  sourceOwnerId: string;
}

export class UpdateBuildingNegotiationStatusService {
  constructor (
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventPublisher,
  ) {
  }

  async updateBuildingStatus (buildingId, {
    status,
    userId,
    sourceOwnerId
  }: UpdateBuildingNegotiationStatusCommand) {
    let updatedBuilding = changeNegotiationStatus(
      await this.buildingsRepository.get(buildingId),
      status
    )
    if (sourceOwnerId) {
      updatedBuilding = withFeaturedOwner(updatedBuilding, sourceOwnerId)
    }

    await this.buildingsRepository.save(updatedBuilding)
    await this.eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId,
      userId,
      negotiationStatus: status
    } as BuildingNegotiationStatusChanged)
  }
}

export const BUILDING_NEGOTIATION_STATUS_CHANGED = 'building.negotiation-status-changed'
