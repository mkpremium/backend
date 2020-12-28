import { CallerToFlipperAssignationRejected } from './caller-to-flipper-assignation-rejected.error'

export class AssignFlipperToCallerService {
  constructor (scheduledCallsService, usersRepository) {
    this.scheduledCallsService = scheduledCallsService
    this.usersRepository = usersRepository
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
