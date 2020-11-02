/**
 * @property {UserMeetingsRepository} userMeetingsRepository
 */
export class GetUserMeetingsService {
  constructor (userMeetingsRepository) {
    this.userMeetingsRepository = userMeetingsRepository
  }

  getMeetingsFor (userId) {
    return this.userMeetingsRepository.getMeetingsFor(userId)
  }
}
