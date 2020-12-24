import { wrap } from 'express-promise-wrap'

/**
 * * @param {TakeNextWorksheetService} getNextWorksheetInQueueService
 */
export const createGetNextCallerWorksheetController = (getNextWorksheetInQueueService) => wrap((req, res) => {
  const callerId = req.user.id
  const callerAssignedQueueId = req.user.operator.profile.queueId

  return getNextWorksheetInQueueService.nextWorksheetInQueue(callerAssignedQueueId, callerId)
    .then((nextWorksheet) => {
      res.json(nextWorksheet)
    })
}
)
