import { BatchCallRequest } from '../../../types/batch-call-request'
import { RetellBatchCallRequest } from '../types/retell-batch-call-request'
import { transformTasktoRetellTask } from './task-to-retell.mapper'

export const transformBatchCallRequestToRetell = (batchCallRequest:BatchCallRequest): RetellBatchCallRequest => {
  return {
    originTelf: batchCallRequest.originTelf,
    tasks: transformTasktoRetellTask(batchCallRequest.tasks)
  }
}
