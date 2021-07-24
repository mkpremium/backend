import { VirtualCaller, VirtualCallerProps } from '../../src/calls/domain/virtual-caller'

const virtualCallerPrototype: VirtualCallerProps = {
  id: 'test-virtual-caller-id',
  assignCallsTo: 'test-human-to-assign-call-id',
  isEnabled: false,
  language: 'spanish',
  name: 'test virtual caller name',
  phoneNumber: '+34666666666',
  queueId: 'test-queue-id',
  timezone: 'Europe/Madrid'
}

export function virtualCallerBuilder (overrides: Partial<VirtualCallerProps> = {}) {
  return {
    build (): VirtualCallerProps {
      return VirtualCaller({ ...virtualCallerPrototype, ...overrides })
    }
  }
}
