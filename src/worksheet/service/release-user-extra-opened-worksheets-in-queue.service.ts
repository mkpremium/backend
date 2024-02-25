import { keepOnlyUserNewestOpenedWorksheets } from '../domain/queue'
import { releaseWorksheet } from '../domain/worksheet'
import { WorksheetQueueRepository } from '../repository/worksheet-queue.repository'
import { WorksheetRepository } from '../repository/worksheet.repository'
import type { Logger } from 'winston'

export class ReleaseUserExtraOpenedWorksheetsInQueueService {
  constructor (
    private worksheetQueueRepository: WorksheetQueueRepository,
    private worksheetRepository: WorksheetRepository,
    private maxOpenedWorksheetPerQueueAndUser: number,
    private logger: Logger
  ) {
  }

  async release (userId: string, queueId: string) {
    const queue = await this.worksheetQueueRepository.get(queueId)
    this.logger.info(`Releasing extra opened worksheets for user ${userId} in queue ${queueId}`, {
      userId,
      queueId,
      queueLength: queue.worksheets.length
    })
    if (queue.worksheets.length <= this.maxOpenedWorksheetPerQueueAndUser) {
      return
    }

    const releasedWorksheetIds = keepOnlyUserNewestOpenedWorksheets(
      queue, userId, this.maxOpenedWorksheetPerQueueAndUser
    )

    this.logger.info(`Releasing ${releasedWorksheetIds.length} worksheets for user ${userId} in queue ${queueId}`)

    await Promise.all(releasedWorksheetIds.map(
      async worksheetId => {
        const worksheet = await this.worksheetRepository.get(worksheetId)
        const releasedWorksheet = releaseWorksheet(worksheet)
        await this.worksheetRepository.save(releasedWorksheet)
      }
    ))
  }
}
