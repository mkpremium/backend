import t from 'tcomb'
import uuid from 'uuid/v4'

export interface VirtualAgentCallProps {
  id: string;
  status: 'CALLING' | 'INPUT_GATHERED' | 'FAILED' | 'DONE';
  worksheetId: string;
  callerId: string;
  ownerId: string;
  contactId: string;
  phoneNumber: string;
  error?: string;
  ownerResponse?: string;
  gatheredAt?: Date,
  createdAt?: Date,
}

export type CallStatus = 'CALLING' | 'INPUT_GATHERED' | 'FAILED' | 'DONE' | 'BUSY' | 'NO_ANSWER'
export const VirtualAgentCall = t.struct<VirtualAgentCallProps>({
    id: t.String,
    status: t.enums.of([ 'CALLING', 'INPUT_GATHERED', 'FAILED', 'DONE', 'BUSY', 'NO_ANSWER' ]),
    worksheetId: t.String,
    ownerId: t.String,
    contactId: t.String,
    phoneNumber: t.String,
    callerId: t.String,
    error: t.maybe(t.String),
    ownerResponse: t.maybe(t.String),
    createdAt: t.maybe(t.Date),
    gatheredAt: t.maybe(t.Date),
    finishedAt: t.maybe(t.Date),
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
