import { emailCopies } from './email-copies'
import { BuildingProps } from '../building'
import { BuildingsRepository } from '../repository/buildings.repository'

export class ProposalsSenderService {
  constructor (
    private proposalsRepository: {
      pendingToSend: () => Promise<any[]>,
      save: (proposal: any) => Promise<void>
    },
    private emailSender: {
      sendMail: (email: {
        to: string,
        subject: string,
        from: any,
        message: string,
        attachment: Buffer[]
      }) => Promise<void>
    },
    private usersRepository: { get: (userId: string) => Promise<any> },
    private pdfProposalComposer: {
      composeProposal: (building: BuildingProps, proposalAmount: number) => Promise<Buffer[]>
    },
    private buildingsRepository: BuildingsRepository,
  ) {
  }

  async checkAndSendProposals () {
    const proposals = await this.proposalsRepository.pendingToSend()

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
          }).then(() => this.proposalsRepository.save(p.sent()))
      })
    )
  }
}
