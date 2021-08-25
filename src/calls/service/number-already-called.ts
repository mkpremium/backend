import { VirtualAgentCallProps } from '../virtual-agent-call'

export class NumberAlreadyCalled implements Error {
  message = 'Phone number already called'
  name = 'NumberAlreadyCalled'

  constructor (
    readonly previousCall: VirtualAgentCallProps,
    readonly newContact: { contactId: string, ownerId: string }
  ) {
  }
}
