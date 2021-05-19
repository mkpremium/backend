import { AwilixContainer } from 'awilix'
import { setupEventListeners } from './event-listeners'

export function worksheetEventListeners (container: AwilixContainer) {
  setupEventListeners(container.resolve('eventBus'), {
    legacyWorksheetRepository: container.resolve('legacyWorksheetRepository'),
    worksheetQueueActionsService: container.resolve('worksheetQueueActionsService'),
    releaseUserOtherActiveWorksheetsInQueueService: container.resolve('releaseUserOtherActiveWorksheetsInQueueService')
  })
}
