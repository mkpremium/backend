import t from 'tcomb'
import uuid from 'uuid/v4'
import { DateTimeString } from '../infrastructure/shared-types'

export interface VirtualAgentCallProps {
  id: string;
  status: 'CALLING' | 'INPUT_GATHERED' | 'FAILED' | 'DONE';
  worksheetId: string;
  ownerId: string;
  contactId: string;
  error?: string;
  ownerResponse?: string;
  gatheredAt?: Date,
}

export const VirtualAgentCall = t.struct<VirtualAgentCallProps>({
    id: t.String,
    status: t.enums.of([ 'CALLING', 'INPUT_GATHERED', 'FAILED', 'DONE' ]),
    worksheetId: t.String,
    ownerId: t.String,
    contactId: t.String,
    error: t.maybe(t.String),
    ownerResponse: t.maybe(t.String),
    gatheredAt: t.maybe(t.Date),
    _documentType: t.String,
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
