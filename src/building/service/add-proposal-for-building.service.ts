import { AddProposalService } from './add-proposal.service'

interface CreateProposalCommand {
  amount: number;
  contactId: string;
  ownerId: string;
  createdBy: string;
  message?: string;
}

export class AddProposalForBuildingService {
  constructor(
    private addProposalService: AddProposalService
  ) {
  }

  add(buildingId: string, cmd: CreateProposalCommand) {
    return this.addProposalService.addProposal(buildingId, cmd.createdBy, {
      state: 'pendiente',
      ownerId: cmd.ownerId,
      proposal: cmd.amount
    })
  }
}
