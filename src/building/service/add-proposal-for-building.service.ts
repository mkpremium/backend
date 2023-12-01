import { AddProposalService } from './add-proposal.service'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { contactOfId } from '../../owner/owner'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

interface CreateProposalCommand {
  amount: number;
  contactId: string;
  ownerId: string;
  createdBy: string;
  message?: string;
}

export interface ProposalForBuildingScheduled {
  name: DomainEventCatalog.BUILDING__PROPOSAL_SCHEDULED;
  createdBy: string;
  ownerId: string;
  buildingId: string
}

export class AddProposalForBuildingService {
  constructor(
    private addProposalService: AddProposalService,
    private ownersRepository: OwnerRepository,
    private eventBus: EventPublisher,
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

    const event: ProposalForBuildingScheduled = {
      name: DomainEventCatalog.BUILDING__PROPOSAL_SCHEDULED,
      buildingId: buildingId,
      createdBy: cmd.createdBy,
      ownerId: cmd.ownerId
    }
    await this.eventBus.publish(event)
  }
}
