/**
 * @property {SelfMeetingsRepository} userMeetingsRepository
 */
export class GetSelfMeetingsService {
  constructor (userMeetingsRepository) {
    this.userMeetingsRepository = userMeetingsRepository
  }

  getMeetingsFor (userId) {
    return this.userMeetingsRepository.getMeetingsFor(userId)
  }
}
