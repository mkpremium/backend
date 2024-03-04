import { ProposalForBuildingScheduled } from '../service/add-proposal-for-building.service'
import { UpdateBuildingNegotiationStatusService } from '../service/update-building-negotiation-status.service'
import { ProposalsSenderService } from '../service/proposals-sender.service'
import { Logger } from 'winston'

interface Deps {
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
  proposalsSenderService: ProposalsSenderService,
  logger: Logger,
}

export const proposalScheduledListenerFactory = ({
  updateBuildingNegotiationStatusService,
  proposalsSenderService,
  logger
}: Deps) => (event: ProposalForBuildingScheduled) => {
  return updateBuildingNegotiationStatusService.updateBuildingStatus(event.buildingId, {
    status: 'PROPOSAL_SCHEDULED',
    sourceOwnerId: event.ownerId,
    userId: event.createdBy
  }).then(async () => {
    const stats = await proposalsSenderService.checkAndSendProposals()
    logger.info('Proposals processed from proposal created listener', stats)
  })
}
