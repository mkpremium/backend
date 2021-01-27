/**
 * @param {AssignFlipperToCallerService} assignFlipperToCallerService
 */
import { CallerToFlipperAssignationRejected } from '../service/caller-to-flipper-assignation-rejected.error'

export const createAssignFlipperToCallerController = ({ assignFlipperToCallerService }) => (req, res) => {
  const { flipperId, callerId } = req.params

  return assignFlipperToCallerService.assign(callerId, flipperId)
    .then(() => {
      res.status(200).json()
    }).catch(error => {
      if (error instanceof CallerToFlipperAssignationRejected) {
        res.status(400)
        res.send(error.reason)
      } else {
        throw error
      }
    })
}
