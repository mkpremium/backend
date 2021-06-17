import { Logger } from 'winston'

type MachineDetectionResponse = 'machine_start' | 'human' | 'fax' | 'unknown'

export class MachineDetectionResultProcessorService {
  constructor (
    private logger: Logger,
  ) {
  }

  process (callId: string, answeredBy: MachineDetectionResponse): Promise<boolean> {
    this.logger.info('twilio-machine-detection-result', { callId, answeredBy })
    return Promise.resolve([ 'human', 'unknown' ].includes(answeredBy))
  }
}
