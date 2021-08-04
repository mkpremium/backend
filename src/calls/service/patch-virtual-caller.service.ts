import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { VirtualCallerProps } from '../domain/virtual-caller'

export interface PatchVirtualCallerProps {
  virtualCallerId: string
  isEnabled?: boolean
  assignCallsTo?: string
}

export const PatchVirtualCallerCommand = t.struct<PatchVirtualCallerProps>({
  virtualCallerId: t.String,
  isEnabled: t.maybe(t.Boolean),
  assignCallsTo: t.maybe(t.String)
})

export class PatchVirtualCallerService {
  async patch (cmd: PatchVirtualCallerProps) {
    const validatedCmd = fromJSON(cmd, PatchVirtualCallerCommand)
  }
}
