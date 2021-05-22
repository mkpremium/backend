import { BuildingProposal, ProposalProps } from '../../src/building/building'


const proposalPrototype: ProposalProps = {
  id: 'test-proposal-id',
  buildingId: 'test-building-id',
  ownerId: 'test-owner-id',
  notificationEmail: 'owner@email.test',
  notificationStatus: 'PENDING',
  createdBy: 'test-flipper-id',
  message: 'test proposal message',
  proposal: 1000000,
}

export const proposalBuilder = (overrides: Partial<ProposalProps> = {}) => ({
  build: () => BuildingProposal({ ...proposalPrototype, ...overrides })
})
