import { keepOnlyUserNewestOpenedWorksheets } from '../domain/queue'
import { WorkSheetStatus } from '../domain/worksheet'
import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { WorksheetRepository } from '../repository/worksheet.repository'

export class ReleaseUserExtraOpenedWorksheetsInQueueService {
  constructor (
    private worksheetQueueRepository: WorksheetQueueRepository,
    private worksheetRepository: WorksheetRepository,
    private maxOpenedWorksheetPerQueueAndUser: number,
  ) {
  }

  async release (userId, queueId) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    if (queue.worksheets.length <= this.maxOpenedWorksheetPerQueueAndUser) {
      return
    }

    const [ queueWithMaxWorksheetForUser, releasedWorksheetIds ] = keepOnlyUserNewestOpenedWorksheets(
      queue, userId, this.maxOpenedWorksheetPerQueueAndUser
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
