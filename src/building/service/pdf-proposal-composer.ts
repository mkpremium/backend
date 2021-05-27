import { BuildingProps } from '../building'

export class PdfProposalComposer {
  composeProposal (building: BuildingProps, proposalAmount: number, language: 'es' | 'pt'): Promise<Buffer[]> {
    return Promise.reject(new Error('not implemented'))
  }
}
