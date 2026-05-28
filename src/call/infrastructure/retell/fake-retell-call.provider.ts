import { BatchCallRequest } from '../../types/batch-call-request'
import { BatchCallResponse } from '../../types/batch-call-response'

export class FakeRetellCallProvider {
  async createBatchCall (
    payload: BatchCallRequest
  ): Promise<BatchCallResponse> {
    console.log('[FAKE RETELL] createBatchCall payload:', JSON.stringify(payload, null, 2))

    return {
      batchId: `fake-batch-${Date.now()}`
    } as BatchCallResponse
  }
}
