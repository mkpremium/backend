import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'
import { LegacyWorksheetRepository } from './models/worksheet-repository'
import { SCHEDULED_EVENT_DELETED } from '../scheduled-events/controllers'
import { WorksheetQueueActionsService } from './service/worksheet-queue-actions-service'
import {
  BUILDING_NEGOTIATION_STATUS_CHANGED,
  BuildingNegotiationStatusChanged
} from '../building/service/update-building-negotiation-status.service'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from './service/release-user-extra-opened-worksheets-in-queue.service'
import { UpdateWorksheetStatusOnOwnerChangeService } from './service/update-worksheet-status-on-owner-change.service'
import { OwnerStatusChangedEvent } from '../owner/service/change-contact-status.service'
import { InvalidWorksheetFound } from './service/take-next-worksheet.service'
import { WorksheetRepository } from './repository/worksheet.repository'
import { Logger } from 'winston'
import { setStatus } from './domain/worksheet'

export function worksheetEventListeners (container: AwilixContainer) {
  const eventBus = container.resolve('eventBus') as EventBus
  const legacyWorksheetRepository = container.resolve('legacyWorksheetRepository') as LegacyWorksheetRepository
  const worksheetRepository = container.resolve('worksheetRepository') as WorksheetRepository
  const worksheetQueueActionsService = container.resolve('worksheetQueueActionsService') as WorksheetQueueActionsService
  const releaseUserOtherActiveWorksheetsInQueueService = container.resolve('releaseUserOtherActiveWorksheetsInQueueService') as ReleaseUserExtraOpenedWorksheetsInQueueService
  const updateWorksheetStatusOnOwnerChangeService = container.resolve('updateWorksheetStatusOnOwnerChangeService') as UpdateWorksheetStatusOnOwnerChangeService
  const logger = container.resolve('logger') as Logger
  const consistencyDelay = container.resolve('consistencyDelay') as number

  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, async ({
                                                            buildingId,
                                                            userId
                                                          }: BuildingNegotiationStatusChanged) => {
    logger.info('updating worksheet because building negotiation status changed', { buildingId, userId })
    try {
      const worksheet = await legacyWorksheetRepository.findWorksheetByBuilding(buildingId)
      await legacyWorksheetRepository.updateStatus(worksheet.id, userId)
    } catch (error) {
      logger.crit('could not update worksheet on building status change', { error, errorMessage: error.message })
    }
  })

  eventBus.on(SCHEDULED_EVENT_DELETED, async ({ id }) => {
    worksheetQueueActionsService.removeScheduledCallFromWorksheets(id)
      .then(() => {
        logger.info('scheduled call removed from worksheet successfully')
      })
      .catch(error => {
        logger.crit('error removing scheduled call from worksheets', { scheduledCallId: id, error })
      })
  })

  eventBus.on('worksheet.taken', async ({ queueId, by }) => {
    await releaseUserOtherActiveWorksheetsInQueueService.release(by, queueId)
  })

  eventBus.on('worksheet.invalid_worksheet_found', async ({ worksheetId }: InvalidWorksheetFound) => {
    logger.info('Invalid worksheet found, updating status', { worksheetId })
    const worksheet = await worksheetRepository.get(worksheetId)
    const updatedWorksheet = setStatus(worksheet, 'INVALID')

    await worksheetRepository.save(updatedWorksheet)
  })

  eventBus.on('owner.status_changed', (evt: OwnerStatusChangedEvent) => {
    return new Promise(resolve => setTimeout(resolve, consistencyDelay))
      .then(() => updateWorksheetStatusOnOwnerChangeService.updateWorksheet(evt))
  })
}
