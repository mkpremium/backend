import { BatchCallRequest } from '../types/batch-call-request'
import { BatchCallResponse } from '../types/batch-call-response'

export interface CallProvider {
   createBatchCall (request:BatchCallRequest): Promise<BatchCallResponse>;
}
