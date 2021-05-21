import { UpdateWorksheetStatusOnOwnerChangeService } from '../../../src/worksheet/service/update-worksheet-status-on-owner-change.service'
import { createTestContainer } from '../../create-test-container'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { WorksheetRepository } from '../../../src/worksheet/repository/worksheet.repository'
import { expect } from 'chai'
import { EventBus } from '../../../src/infrastructure/event-bus'
import { OwnerStatusChangedEvent } from '../../../src/owner/service/change-contact-status.service'
import { worksheetEventListeners } from '../../../src/worksheet/listeners'

describe('UpdateWorksheetStatusOnOwnerChangeService', () => {
  let service: UpdateWorksheetStatusOnOwnerChangeService
  let worksheetRepository: WorksheetRepository
  let eventBus: EventBus
  const testWorksheet = worksheetBuilder().build()
  const testOwnerId = 'test-owner-id'
  const testEvent: OwnerStatusChangedEvent = {
    name: 'owner.status_changed',
    buildingId: testWorksheet.relatedBuildingIds[0],
    ownerId: testOwnerId,
    oldStatus: 'NO_VERIFICADO',
    newStatus: 'WITHOUT_CONTACT',
  }

  before(async () => {
    const container = await createTestContainer()
    worksheetEventListeners(container)
    service = container.resolve('updateWorksheetStatusOnOwnerChangeService')
    worksheetRepository = container.resolve('worksheetRepository')
    eventBus = container.resolve('eventBus')

    await worksheetRepository.save(testWorksheet)
    await new Promise(resolve => setTimeout(resolve, 500))
  })

  it('sets worksheet to invalid when no owner has contact', () => {
    eventBus.publish(testEvent)
    return new Promise(resolve => setTimeout(resolve, 500))
      .then(async () => {
        const updatedWorksheet = await worksheetRepository.get(testWorksheet.id)

        expect(updatedWorksheet.status).to.be.equal('INVALID')
      })
  })
})
