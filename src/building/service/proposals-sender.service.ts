import { emailCopies } from './email-copies'
import { ProposalProps, proposalSent } from '../building'
import { BuildingsRepository } from '../repository/buildings.repository'
import { ProposalsRepository } from '../repository/proposals.repository'
import { EmailSenderService } from '../../email/email-sender.service'
import { UserRepository } from '../../user/repository/user.repository'
import { PdfProposalComposer } from './pdf-proposal-composer'
import { Logger } from 'winston'
import { ScheduledEventsRepository } from '../../scheduled-events/repository/schedule-events.repository'
import moment from 'moment'

export class ProposalsSenderService {
  constructor (
    private proposalsRepository: ProposalsRepository,
    private emailSender: EmailSenderService,
    private usersRepository: UserRepository,
    private pdfProposalComposer: PdfProposalComposer,
    private buildingsRepository: BuildingsRepository,
    private scheduledEventsRepository: ScheduledEventsRepository,
    private logger: Logger,
  ) {
  }

  async checkAndSendProposals () {
    const lastScheduledEventDateToInclude = moment().add(-3, 'days').startOf('day')
    const proposals = await this.proposalsRepository.pendingProposals()

    for (let proposal of proposals) {
      try {
        await this.processProposal(proposal, lastScheduledEventDateToInclude)
      } catch (error) {
        this.logger.crit('pending proposal not sent', {
          error,
          errorMessage: error.message,
          proposalId: proposal.id
        })
      }
    }
  }

  private async processProposal (proposal: ProposalProps, lastScheduledEventDateToInclude: moment.Moment) {
    const [ building, sender, lastScheduledEvent ] = await Promise.all([
      this.buildingsRepository.get(proposal.buildingId),
      this.usersRepository.get(proposal.createdBy),
      this.scheduledEventsRepository.lastScheduledEventForBuilding(proposal.buildingId)
    ])
    if (lastScheduledEvent && moment(lastScheduledEvent.eventDate).isAfter(lastScheduledEventDateToInclude)) {
      return
    }

    const proposalPDF = await this.pdfProposalComposer.composeProposal(
      building, proposal.proposal, sender.profile
    )

    await this.emailSender.sendMail({
      to: proposal.notificationEmail,
      subject: emailCopies[sender.profile.language].mailSubject,
      message: proposal.message,
      from: sender,
      attachment: proposalPDF,
    })

    await this.proposalsRepository.save(proposalSent(proposal))
  }
}
