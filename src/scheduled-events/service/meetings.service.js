export class MeetingsService {
  constructor ({ meetingsRepository }) {
    this.meetingsRepository = meetingsRepository
  }

  futureMeetingsFor (userId) {
    return Promise.resolve([])
  }
}
