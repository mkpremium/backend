import { CallerToFlipperAssignationRejected } from './caller-to-flipper-assignation-rejected.error'
import { User } from '../../types/user'

/**
 * @property {ScheduledCallsService} scheduledCallsService
 * @property {UserRepository} usersRepository
 */
export class AssignFlipperToCallerService {
  constructor (scheduledCallsService, usersRepository) {
    this.scheduledCallsService = scheduledCallsService
    this.usersRepository = usersRepository
  }

  assign (callerId, flipperId) {
    return Promise.all([
      this.scheduledCallsService.scheduledCallsFor(callerId),
      this.usersRepository.get(callerId),
      this.usersRepository.get(flipperId)
    ]).then(([ callerScheduledCalls, caller, flipper ]) => {
      if (callerScheduledCalls.length > 0) {
        throw new CallerToFlipperAssignationRejected(
          'Caller with scheduled calls cannot change flipper'
        )
      }

      if (caller.profile.queueId !== flipper.profile.queueId) {
        throw new CallerToFlipperAssignationRejected(
          'Caller and flipper queues mismatch'
        )
      }

      return this.usersRepository.save(User.update(caller, {
        flipperId: {
          $set: flipperId
        }
      }))
    })
  }
}
