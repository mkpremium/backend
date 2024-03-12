import type { Logger } from 'winston'
import type { EntityManager } from 'typeorm'
import { Worksheet } from '../worksheet.entity'
import _ from 'lodash'
import {
  mapNegotiationStatusToWorksheetStatus
} from './sync-worksheet-status-on-building-negotiation-status-change.service'

export class ReleaseUserExtraOpenedWorksheetsInQueueService {
  constructor (
    private maxOpenedWorksheetPerQueueAndUser: number,
    private logger: Logger,
    private entityManager: EntityManager
  ) {
  }

  async release (userOrCallerId: string, queueId: string) {
    this.logger.info(`Releasing extra opened worksheets for user ${userOrCallerId} in queue ${queueId}`, {
      userId: userOrCallerId,
      queueId
    })
    await this.entityManager.transaction(async transactionalEntityManager => {
      const worksheets = await transactionalEntityManager.find(Worksheet, {
        where: {
          queue: { id: queueId },
          heldBy: [
            {
              user: { id: userOrCallerId }
            },
            {
              id: userOrCallerId
            }
          ],
          status: 'TAKEN'
        },
        order: {
          lastViewedAt: 'DESC'
        },
        relations: {
          building: {
            assignedFlipper: true
          }
        }
      })

      if (worksheets.length <= this.maxOpenedWorksheetPerQueueAndUser) {
        this.logger.info(`No extra opened worksheets for user ${userOrCallerId} in queue ${queueId}`)
        return
      }

      const worksheetsToRelease = _.takeRight(worksheets, worksheets.length - this.maxOpenedWorksheetPerQueueAndUser)
      this.logger.info(`Releasing ${worksheetsToRelease.length} worksheets for user ${userOrCallerId} in queue ${queueId}`)

      await Promise.all(worksheetsToRelease.map(
        async (worksheet) => {
          worksheet.status = mapNegotiationStatusToWorksheetStatus(
            worksheet.building.negotiationStatus, worksheet.building.assignedFlipper?.id)
          worksheet.queue = null
          worksheet.heldBy = null
          await transactionalEntityManager.save(worksheet)
        }
      ))
    })
  }
}
