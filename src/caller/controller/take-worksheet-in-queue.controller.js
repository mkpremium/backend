/**
 * @param {WorksheetQueueActionsService} takeWorksheetService
 */
export const createTakeWorksheetInQueueController = ({ takeWorksheetService }) => (req, res) => {
  return takeWorksheetService.takeWorksheetInQueue(
    req.user.operator.profile.queueId,
    req.params.worksheetId,
    req.user.id
  ).then(takenWorksheet => {
    res.json(takenWorksheet)
  })
}
