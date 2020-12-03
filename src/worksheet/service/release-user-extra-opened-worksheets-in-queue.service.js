export class ReleaseUserExtraOpenedWorksheetsInQueueService {
  constructor (worksheetQueueRepository, maxOpenedWorksheetPerQueueAndUser) {
    this.worksheetQueueRepository = worksheetQueueRepository
    this.maxOpenedWorksheetPerQueueAndUser = maxOpenedWorksheetPerQueueAndUser
  }

  async release (userId, queueId) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    if (queue.worksheets.length <= this.maxOpenedWorksheetPerQueueAndUser) {
      return
    }

    const queueWithMaxWorkseetForUser = queue.keepOnlyUserNewestOpenedWorksheets(
      userId, this.maxOpenedWorksheetPerQueueAndUser
    )

    await this.worksheetQueueRepository.save(queueWithMaxWorkseetForUser)
    // TODO save worksheets
  }
}
