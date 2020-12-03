import { WorkSheetStatus } from '../domain/worksheet'

/**
 * @property {WorksheetRepository} worksheetRepository
 * @property {WorksheetQueueRepository} worksheetQueueRepository
 * @property {number} maxOpenedWorksheetPerQueueAndUser
 */
export class ReleaseUserExtraOpenedWorksheetsInQueueService {
  constructor (
    worksheetQueueRepository,
    worksheetRepository,
    maxOpenedWorksheetPerQueueAndUser
  ) {
    this.worksheetRepository = worksheetRepository
    this.worksheetQueueRepository = worksheetQueueRepository
    this.maxOpenedWorksheetPerQueueAndUser = maxOpenedWorksheetPerQueueAndUser
  }

  async release (userId, queueId) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    if (queue.worksheets.length <= this.maxOpenedWorksheetPerQueueAndUser) {
      return
    }

    const [ queueWithMaxWorksheetForUser, releasedWorksheetIds ] = queue.keepOnlyUserNewestOpenedWorksheets(
      userId, this.maxOpenedWorksheetPerQueueAndUser
    )

    await this.worksheetQueueRepository.save(queueWithMaxWorksheetForUser)
    await Promise.all(releasedWorksheetIds.map(
      worksheetId => this.worksheetRepository.patch(worksheetId, {
        status: { $set: WorkSheetStatus.AVAILABLE },
        queueId: { $set: null },
        statusChangedAt: { $set: new Date() }
      })
    ))
  }
}
