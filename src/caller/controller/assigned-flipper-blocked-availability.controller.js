/**
 * @param {FlipperAvailabilityService} flipperAvailabilityService
 */
export const createAssignedFlipperBlockedAvailabilityController = ({ flipperAvailabilityService }) => (req, res) => {
  const { flipperId } = req.user
  if (!flipperId) {
    res.status(400)
    res.send('Caller does not have any flipper assigned')
    return Promise.resolve()
  }

  return flipperAvailabilityService.blockedAvailabilityForFlipper(flipperId)
    .then(flipperBlockedAvailability => {
      res.json(flipperBlockedAvailability)
    })
}
