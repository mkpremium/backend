import { ProposalForBuildingScheduled } from '../service/add-proposal-for-building.service'
import { UpdateBuildingNegotiationStatusService } from '../service/update-building-negotiation-status.service'

interface Deps {
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService
}

export const createProposalScheduledListener = ({ updateBuildingNegotiationStatusService }: Deps) => (event: ProposalForBuildingScheduled) => {
  return updateBuildingNegotiationStatusService.updateBuildingStatus(event.buildingId, {
    status: 'PROPOSAL_SCHEDULED',
    sourceOwnerId: event.ownerId,
    userId: event.createdBy,
  })
}

