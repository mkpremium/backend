/**
 * @param {FlipperAvailabilityService} flipperAvailabilityService
 */
export const createFlipperAvailabilityController = ({ flipperAvailabilityService }) => (req, res) => {
  return flipperAvailabilityService.unavailabilityForFlipper(req.user.flipperId)
    .then(flipperAvailability => {
      res.json(flipperAvailability)
    })
}
