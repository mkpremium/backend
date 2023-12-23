import { BuildingProposal, ProposalProps } from '../../src/building/building'
import uuid from 'uuid/v4'


const proposalPrototype: Omit<ProposalProps, 'buildingId'> = {
  id: 'test-proposal-id',
  state: 'pendiente',
  ownerId: 'test-owner-id',
  notificationEmail: 'owner@email.test',
  notificationStatus: 'PENDING',
  createdBy: 'test-flipper-id',
  message: 'test proposal message',
  proposal: 1_000_000,
}

export const proposalBuilder = (overrides: Partial<ProposalProps> = {}) => ({
  build: () => BuildingProposal({ ...proposalPrototype, buildingId: uuid(), ...overrides })
})
