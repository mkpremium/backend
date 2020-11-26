export const createTakeWorksheetIntoQueueController = worksheetQueueActionsService => async (req, res) => {
  const updatedWorksheet = await worksheetQueueActionsService.takeWorksheetInQueue(
    req.params.queueId,
    req.params.worksheetId,
    req.user.id
  )

  res.json(updatedWorksheet)
}
