import type { MeetingsRepository } from '../repository/meetings.repository'

export class MeetingsService {
  constructor (private meetingsRepository: MeetingsRepository) {
  }

  futureMeetingsFor (userId: string) {
    return this.meetingsRepository.futureMeetingsFor(userId)
  }
}
