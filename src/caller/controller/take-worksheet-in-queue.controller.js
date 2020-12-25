/**
 * @param {WorksheetQueueActionsService} worksheetQueueActionsService
 */
export const createTakeWorksheetInQueueController = ({ worksheetQueueActionsService }) => (req, res) => {
  return worksheetQueueActionsService.takeWorksheetInQueue(
    req.user.operator.profile.queueId,
    req.params.worksheetId,
    req.user.id
  ).then(takenWorksheet => {
    res.json(takenWorksheet)
  })
}
