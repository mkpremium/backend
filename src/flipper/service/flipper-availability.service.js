/**
 * @property {MeetingsService} meetingsService
 */
export class FlipperAvailabilityService {
  constructor ({ meetingsService }) {
    this.meetingsService = meetingsService
  }

  blockedAvailabilityForFlipper (flipperId) {
    return this.meetingsService
      .futureMeetingsFor(flipperId)
      .then(flipperMeetings => flipperMeetings.map(({ meetingAt }) => ({
        startsAt: meetingAt,
        endsAt: meetingAt.clone().add(1, 'hour')
      })))
  }
}
