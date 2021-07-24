import t from 'tcomb'
import uuid from 'uuid/v4'

export interface VirtualCallerProps {
  id?: string;
  queueId: string;
  name: string;
  assignCallsTo: string;
  phoneNumber: string;
  language: 'spanish' | 'portuguese';
  timezone: 'Europe/Madrid' | 'Europe/Lisbon';
  isEnabled: boolean;
}

export const VirtualCaller = t.struct<VirtualCallerProps>({
  id: t.String,
  queueId: t.String,
  name: t.String,
  assignCallsTo: t.String,
  phoneNumber: t.String,
  language: t.enums.of([ 'spanish', 'portuguese' ]),
  timezone: t.enums.of([ 'Europe/Madrid', 'Europe/Lisbon' ]),
  isEnabled: t.Boolean,
  createdAt: t.Date,
  _documentType: t.refinement(t.String, dt => dt === 'virtual-caller')
}, {
  name: 'VirtualCaller',
  defaultProps: {
    get id () {
      return uuid()
    },
    get createdAt () {
      return new Date()
    },
    _documentType: 'virtual-caller'
  }
})
