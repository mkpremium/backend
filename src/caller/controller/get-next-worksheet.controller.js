/**
 * * @param {TakeNextWorksheetService} takeNextWorksheetInQueueService
 */
export const createGetNextCallerWorksheetController = ({ takeNextWorksheetInQueueService }) => (req, res) => {
  const callerId = req.user.id
  const callerAssignedQueueId = req.user.operator.profile.queueId

  return takeNextWorksheetInQueueService.nextWorksheetInQueueOfId(callerAssignedQueueId, callerId)
    .then((nextWorksheet) => {
      res.json(nextWorksheet)
    })
}
