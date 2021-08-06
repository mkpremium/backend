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
import { UpdateBuildingNegotiationStatusService } from './update-building-negotiation-status.service'

function isFridayOrWeekend (lastScheduledEventDateToInclude: moment.Moment) {
  return [ 5, 6, 7 ].includes(lastScheduledEventDateToInclude.isoWeekday())
}

export class ProposalsSenderService {
  constructor (
    private proposalsRepository: ProposalsRepository,
    private emailSender: EmailSenderService,
    private usersRepository: UserRepository,
    private pdfProposalComposer: PdfProposalComposer,
    private buildingsRepository: BuildingsRepository,
    private scheduledEventsRepository: ScheduledEventsRepository,
    private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
    private logger: Logger,
  ) {
  }

  async checkAndSendProposals () {
    if (isOutsideWorkingHours()) {
      this.logger.info('Outside working hours, not sending email')
      return
    }
    let lastScheduledEventDateToInclude = moment().add(-3, 'days')
    if (isFridayOrWeekend(lastScheduledEventDateToInclude)) {
      lastScheduledEventDateToInclude = lastScheduledEventDateToInclude.isoWeekday(4)
    }

    const proposals = await this.proposalsRepository.pendingProposals()
    this.logger.info('Pending proposals to process', { proposals: proposals.map(p => p.id) })

    const stats = {
      pendingProposals: proposals.length,
      sent: [],
      skipped: [],
      success: 0,
      errors: 0,
    }

    for (let proposal of proposals) {
      try {
        const wasSent = await this.processProposal(proposal, lastScheduledEventDateToInclude)
        stats.success++
        if (wasSent) {
          stats.sent.push(proposal.id)
        } else {
          stats.skipped.push(proposal.id)
        }
      } catch (error) {
        this.logger.crit('pending proposal not sent', {
          errorMessage: error.message,
          stack: error.stack,
          proposalId: proposal.id,
        })
        stats.errors++
      }
    }
    return stats
  }

  private async processProposal (proposal: ProposalProps, lastScheduledEventDateToInclude: moment.Moment): Promise<boolean> {
    const [ building, sender, lastScheduledEvent ] = await Promise.all([
      this.buildingsRepository.get(proposal.buildingId),
      this.usersRepository.get(proposal.createdBy),
      this.scheduledEventsRepository.lastScheduledEventForBuilding(proposal.buildingId)
    ])
    if (lastScheduledEvent && moment(lastScheduledEvent.eventDate).isAfter(lastScheduledEventDateToInclude)) {
      return false
    }

    const proposalPDF = await this.pdfProposalComposer.composeProposal(
      building, proposal.proposal, sender.profile
    )

    await this.emailSender.sendMail({
      to: proposal.notificationEmail,
      subject: emailCopies[ sender.profile.language ].mailSubject,
      message: proposal.message,
      from: sender,
      attachment: {
        content: proposalPDF,
        filename: 'propuesta.pdf'
      },
    })

    await this.proposalsRepository.save(proposalSent(proposal))
    await this.updateBuildingNegotiationStatusService.updateBuildingStatus(
      proposal.buildingId,
      {
        status: 'PROPUESTA ENVIADA',
        sourceOwnerId: proposal.ownerId,
        userId: proposal.createdBy,
      }
    )

    return true
  }
}

function isOutsideWorkingHours () {
  const now = moment().tz('Europe/Madrid')
  return now.hours() < 9 || now.hours() >= 20 || [ 6, 7 ].includes(now.isoWeekday())
}
