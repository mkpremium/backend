import { CallProvider } from '../../domain/call-provider.interface'
import { BatchCallRequest } from '../../types/batch-call-request'
import { BatchCallResponse } from '../../types/batch-call-response'
import { transformBatchCallRequestToRetell } from './mappers/batch-call-request-to-retell.mapper'
import { RetellBatchCallRequest } from './types/retell-batch-call-request'
import { BatchCallCreateBatchCallParams } from 'retell-sdk/resources/batch-call.mjs'
import { initLogger } from '../../../infrastructure/logger'
import Retell from 'retell-sdk'

export class RetellCallProvider implements CallProvider {
  constructor (
          private retellClient: Retell,
          private logger: ReturnType<typeof initLogger>
  ) {}

  async createBatchCall (request: BatchCallRequest): Promise<BatchCallResponse> {
    const retellBatchCallRequest: RetellBatchCallRequest = transformBatchCallRequestToRetell(request)
    const batchCallParams: BatchCallCreateBatchCallParams = this.buildCallPayload(retellBatchCallRequest)
    try {
      const batchCallResponse = await this.retellClient.batchCall.createBatchCall(batchCallParams)
      this.logger.info(`Batch call created:${batchCallResponse.batch_call_id}`)
      return {
        batchId: batchCallResponse.batch_call_id,
        totalCalls: batchCallResponse.total_task_count
      }
    } catch (err:any) {
      this.logger.error(`Error creating batch call:${err.message || err}`)
      throw err
    }
  }

  buildCallPayload (request:RetellBatchCallRequest): BatchCallCreateBatchCallParams {
    const timeStamp = request.timeStamp

    const baseParams = {
      from_number: request.originTelf,
      tasks: request.tasks,
      reserved_concurrency: 1
    }

    if (timeStamp) {
      const params = {
        ...baseParams,
        trigger_timestamp: request.timeStamp
      }
      return params
    }

    return baseParams
  }
}
