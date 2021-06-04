import { AddProposalService } from './add-proposal.service'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { contactOfId } from '../../owner/owner'
import { EventBus } from '../../infrastructure/event-bus'

interface CreateProposalCommand {
  amount: number;
  contactId: string;
  ownerId: string;
  createdBy: string;
  message?: string;
}

interface ProposalForBuildingAdded {
  name: 'building.proposal_added';
  createdBy: string;
  ownerId: string;
  buildingId: string
}

export class AddProposalForBuildingService {
  constructor(
    private addProposalService: AddProposalService,
    private ownersRepository: OwnerRepository,
    private eventBus: EventBus,
  ) {
  }

  async add (buildingId: string, cmd: CreateProposalCommand): Promise<void> {
    const owner = await this.ownersRepository.get(cmd.ownerId)
    await this.addProposalService.addProposal(buildingId, cmd.createdBy, {
      state: 'pendiente',
      ownerId: cmd.ownerId,
      proposal: cmd.amount,
      message: cmd.message,
      notificationStatus: 'PENDING',
      notificationEmail: contactOfId(owner, cmd.contactId).value,
    })

    const event: ProposalForBuildingAdded = {
      name: 'building.proposal_added',
      buildingId: buildingId,
      createdBy: cmd.createdBy,
      ownerId: cmd.ownerId
    }
    await this.eventBus.publish(event)
  }
}
