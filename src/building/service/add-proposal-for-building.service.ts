import { AddProposalService } from './add-proposal.service'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { contactOfId } from '../../owner/owner'

interface CreateProposalCommand {
  amount: number;
  contactId: string;
  ownerId: string;
  createdBy: string;
  message?: string;
}

export class AddProposalForBuildingService {
  constructor(
    private addProposalService: AddProposalService,
    private ownersRepository: OwnerRepository
  ) {
  }

  async add (buildingId: string, cmd: CreateProposalCommand) {
    const owner = await this.ownersRepository.get(cmd.ownerId)
    return this.addProposalService.addProposal(buildingId, cmd.createdBy, {
      state: 'pendiente',
      ownerId: cmd.ownerId,
      proposal: cmd.amount,
      message: cmd.message,
      notificationStatus: 'PENDING',
      notificationEmail: contactOfId(owner, cmd.contactId).value,
    })
  }
}
