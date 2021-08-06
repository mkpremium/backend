import { VirtualAgentCall, VirtualAgentCallProps } from '../../src/calls/virtual-agent-call'

const callPrototype: VirtualAgentCallProps = {
  createdAt: new Date(),
  status: 'FAILED',
  id: '',
  callerId: '',
  contactId: '',
  ownerId: '',
  phoneNumber: '',
  worksheetId: '',
}

export function callBuilder (overrides: Partial<VirtualAgentCallProps> = {}) {
  return {
    build (): VirtualAgentCallProps {
      return VirtualAgentCall({ ...callPrototype, ...overrides })
    }
  }
}
