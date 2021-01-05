/**
 * @property {MeetingsService} meetingsService
 */
export class FlipperAvailabilityService {
  constructor ({ meetingsService, userBlockedAvailabilityService }) {
    this.meetingsService = meetingsService
    this.userBlockedAvailabilityService = userBlockedAvailabilityService
  }

  blockedAvailabilityForFlipper (flipperId) {
    return Promise.all([
      this.meetingsService.futureMeetingsFor(flipperId),
      this.userBlockedAvailabilityService.blockedAvailabilityForUser(flipperId)
    ]).then(([ flipperMeetings, flipperBlockedAvailability ]) => {
      return flipperMeetings.map(({ id: meetingId, buildingId, meetingAt }) => ({
        type: 'MEETING',
        meetingId,
        buildingId,
        startsAt: meetingAt,
        endsAt: meetingAt.clone().add(1, 'hour')
      })).concat(flipperBlockedAvailability.map(ba => ({ ...ba, type: 'BLOCKED-AVAILABILITY' })))
    })
  }
}
