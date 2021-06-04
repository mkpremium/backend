import { ProposalForBuildingScheduled } from '../service/add-proposal-for-building.service'
import { UpdateBuildingNegotiationStatusService } from '../service/update-building-negotiation-status.service'
import { ProposalsSenderService } from '../service/proposals-sender.service'

interface Deps {
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
  proposalsSenderService: ProposalsSenderService,
}

export const createProposalScheduledListener = ({
                                                  updateBuildingNegotiationStatusService,
                                                  proposalsSenderService
                                                }: Deps) => (event: ProposalForBuildingScheduled) => {
  return updateBuildingNegotiationStatusService.updateBuildingStatus(event.buildingId, {
    status: 'PROPOSAL_SCHEDULED',
    sourceOwnerId: event.ownerId,
    userId: event.createdBy,
  }).then(() => proposalsSenderService.checkAndSendProposals())
}

