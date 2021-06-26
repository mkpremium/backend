type MachineDetectionResponse = 'machine_start' | 'human' | 'fax' | 'unknown'

export class MachineDetectionResultProcessorService {
  process (callId: string, answeredBy: MachineDetectionResponse): Promise<boolean> {
    return Promise.resolve([ 'human', 'unknown' ].includes(answeredBy))
  }
}
