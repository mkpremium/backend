import { VirtualAgentCall, VirtualAgentCallProps } from '../../src/calls/virtual-agent-call'

const callPrototype: VirtualAgentCallProps = {
  id: 'test-call-id',
  createdAt: new Date(),
  status: 'FAILED',
  callerId: 'test-caller-id',
  contactId: 'test-contact-id',
  ownerId: 'test-owner-id',
  phoneNumber: '+34611111111',
  worksheetId: 'test-worksheet-id',
  error: null,
  ownerResponse: null,
  gatheredAt: null,
  finishedAt: null,
}

export function callBuilder (overrides: Partial<VirtualAgentCallProps> = {}) {
  return {
    build (): VirtualAgentCallProps {
      return VirtualAgentCall({ ...callPrototype, ...overrides })
    }
  }
}
