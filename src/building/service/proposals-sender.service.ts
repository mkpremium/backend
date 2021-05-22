import { emailCopies } from './email-copies'
import { BuildingProps, proposalSent } from '../building'
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

    return Promise.all(
      proposals.map(p => {
        return Promise.all([
          this.buildingsRepository.get(p.buildingId),
          this.usersRepository.get(p.createdBy),
        ])
          .then(async ([ building, sender ]) => {
            const proposalPDF = await this.pdfProposalComposer.composeProposal(building, p.proposal)

            await this.emailSender.sendMail({
              to: p.notificationEmail,
              subject: emailCopies[sender.profile.language].mailSubject,
              message: p.message,
              from: sender,
              attachment: proposalPDF,
            })
          }).then(() => this.proposalsRepository.save(proposalSent(p)))
      })
    )
  }
}
