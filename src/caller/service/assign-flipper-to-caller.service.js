import { CallerToFlipperAssignationRejected } from './caller-to-flipper-assignation-rejected.error'

export class AssignFlipperToCallerService {
  constructor (scheduledCallsService) {
    this.scheduledCallsService = scheduledCallsService
  }

  assign (callerId, flipperId) {
    return Promise.reject(new CallerToFlipperAssignationRejected('NOT_IMPLEMENTED'))
  }
}
