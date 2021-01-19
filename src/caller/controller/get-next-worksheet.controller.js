/**
 * * @param {TakeNextWorksheetService} takeNextWorksheetService
 */
export const createGetNextCallerWorksheetController = ({ takeNextWorksheetService }) => (req, res) => {
  const callerId = req.user.id
  const callerAssignedQueueId = req.user.operator.profile.queueId

  return takeNextWorksheetService.nextWorksheetInQueueOfId(callerAssignedQueueId, callerId)
    .then((nextWorksheet) => {
      res.json(nextWorksheet)
    })
}
