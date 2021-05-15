interface CreateProposalCommand {
  amount: number;
  contactId: string;
  ownerId: string;
  createdBy: string;
  message?: string;
}

export class AddProposalForBuildingService {
  add(buildingId: string, proposal: CreateProposalCommand) {
    return Promise.reject(new Error('Not implemented'))
  }
}
