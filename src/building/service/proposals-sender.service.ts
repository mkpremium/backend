import { emailCopies } from './email-copies'
import { BuildingProps, ProposalProps, proposalSent } from '../building'
import { BuildingsRepository } from '../repository/buildings.repository'
import { ProposalsRepository } from '../repository/proposals.repository'
import { EmailSenderService } from '../../email/email-sender.service'
import { UserRepository } from '../../user/repository/user.repository'
import { PdfProposalComposer } from './pdf-proposal-composer'

export class ProposalsSenderService {
  constructor (
    private proposalsRepository: ProposalsRepository,
    private emailSender: EmailSenderService,
    private usersRepository: UserRepository,
    private pdfProposalComposer: PdfProposalComposer,
    private buildingsRepository: BuildingsRepository,
  ) {
  }

  async checkAndSendProposals () {
    const proposals = await this.proposalsRepository.pendingProposals()

    for (let proposal of proposals) {
      await this.processProposal(proposal)
    }
  }

  private processProposal (proposal: ProposalProps) {
    return Promise.all([
      this.buildingsRepository.get(proposal.buildingId),
      this.usersRepository.get(proposal.createdBy),
    ])
      .then(async ([ building, sender ]) => {
        const proposalPDF = await this.pdfProposalComposer.composeProposal(building, proposal.proposal)

        await this.emailSender.sendMail({
          to: proposal.notificationEmail,
          subject: emailCopies[sender.profile.language].mailSubject,
          message: proposal.message,
          from: sender,
          attachment: proposalPDF,
        })
      }).then(() => this.proposalsRepository.save(proposalSent(proposal)))
  }
}
