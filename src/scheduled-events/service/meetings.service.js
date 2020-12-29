/**
 * @property {MeetingsRepository} meetingsRepository
 */
export class MeetingsService {
  constructor ({ meetingsRepository }) {
    this.meetingsRepository = meetingsRepository
  }

  futureMeetingsFor (userId) {
    return this.meetingsRepository.futureMeetingsFor(userId)
  }
}
