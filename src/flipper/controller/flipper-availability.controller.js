/**
 * @param {FlipperAvailabilityService} flipperAvailabilityService
 */
export const createFlipperBlockedAvailabilityController = ({ flipperAvailabilityService }) => (req, res) => {
  return flipperAvailabilityService.blockedAvailabilityForFlipper(req.params.flipperId)
    .then(flipperAvailability => {
      res.json(flipperAvailability)
    })
}
