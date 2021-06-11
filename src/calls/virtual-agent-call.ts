import t from 'tcomb'
import uuid from 'uuid/v4'

export interface VirtualAgentCallProps {
  id: string;
  status: 'CALLING' | 'INPUT_GATHERED' | 'FAILED';
}

export const VirtualAgentCall = t.struct<VirtualAgentCallProps>({
    id: t.String,
    status: t.enums.of([ 'CALLING', 'INPUT_GATHERED', 'FAILED' ]),
    error: t.maybe(t.String)
  },
  {
    name: 'VirtualAgentCall',
    defaultProps: {
      get id () {
        return uuid()
      },
      status: 'CALLING',
      _documentType: 'virtual-agent-call'
    }
  }
)
