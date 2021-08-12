import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { setVirtualCallerAssignCallsTo, setVirtualCallerIsEnabled, VirtualCallerProps } from '../domain/virtual-caller'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

export interface PatchVirtualCallerProps {
  virtualCallerId: string
  isEnabled?: boolean
  assignCallsTo?: string
}

export const PatchVirtualCallerCommand = t.refinement(
  t.struct<PatchVirtualCallerProps>({
    virtualCallerId: t.String,
    isEnabled: t.maybe(t.Boolean),
    assignCallsTo: t.maybe(t.String),
  }),
  cmd => cmd.assignCallsTo !== null || cmd.isEnabled !== null
)

export class PatchVirtualCallerService {
  constructor (
    private virtualCallersRepository: VirtualCallersRepository,
  ) {
  }

  async patch (cmd: PatchVirtualCallerProps): Promise<VirtualCallerProps> {
    const validatedCmd = fromJSON(cmd, PatchVirtualCallerCommand)

    let virtualCaller = await this.virtualCallersRepository.get(validatedCmd.virtualCallerId)

    if (validatedCmd.isEnabled !== null) {
      virtualCaller = setVirtualCallerIsEnabled(virtualCaller, validatedCmd.isEnabled)
    }
    if (validatedCmd.assignCallsTo) {
      virtualCaller = setVirtualCallerAssignCallsTo(virtualCaller, validatedCmd.assignCallsTo)
    }

    await this.virtualCallersRepository.save(virtualCaller)

    return virtualCaller
  }
}
