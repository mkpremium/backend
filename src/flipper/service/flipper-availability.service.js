export class FlipperAvailabilityService {
  constructor ({ meetingsService }) {
    this.meetingsService = meetingsService
  }

  unavailabilityForFlipper (flipperId) {
    return this.meetingsService.futureMeetingsFor(flipperId)
  }
}
