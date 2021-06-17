export class MachineDetectionResponseProcessorService {

  process (callId: string, answeredBy: string): Promise<boolean> {
    // TODO save result as counter
    return Promise.resolve(answeredBy === 'human')
  }
}
