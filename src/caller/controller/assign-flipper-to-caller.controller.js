/**
 * @param {AssignFlipperToCallerService} assignFlipperToCallerService
 */
import { CallerToFlipperAssignationRejected } from '../service/caller-to-flipper-assignation-rejected.error'

export const createAssignFlipperToCallerController = ({ assignFlipperToCallerService }) => (req, res) => {
  const callerId = req.user.id
  const { flipperId } = req.params

  return assignFlipperToCallerService.assign(callerId, flipperId)
    .then(() => {
      res.sendStatus(200)
    }).catch(error => {
      if (error instanceof CallerToFlipperAssignationRejected) {
        res.status(400)
        res.send(error.reason)
      } else {
        throw error
      }
    })
}
