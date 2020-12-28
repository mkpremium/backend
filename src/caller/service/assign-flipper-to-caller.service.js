import { CallerToFlipperAssignationRejected } from './caller-to-flipper-assignation-rejected.error'

export class AssignFlipperToCallerService {
  constructor (scheduledCallsService) {
    this.scheduledCallsService = scheduledCallsService
  }

  assign (callerId, flipperId) {
    return this.scheduledCallsService.scheduledCallsFor(callerId)
      .then(callerScheduledCalls => {
        if (callerScheduledCalls.length > 0) {
          throw new CallerToFlipperAssignationRejected(
            'Caller with scheduled calls cannot change flipper'
          )
        }
      })
  }
}
