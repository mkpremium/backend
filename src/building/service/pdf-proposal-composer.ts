import { BuildingProps } from '../building'

export class PdfProposalComposer {
  composeProposal (building: BuildingProps, proposalAmount: number, sender): Promise<Buffer[]> {
    return Promise.reject(new Error('not implemented'))
  }
}
