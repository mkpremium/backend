import { initApplication } from '../../../test-e2e/helper/rest-api-helper'
import { expect } from 'chai'
import { WorkSheetStatus } from '../../../src/worksheet/domain/worksheet'

describe('ScheduleEventsRepository', () => {
  let app
  let repository
  let worksheetRepository

  beforeEach(async () => {
    app = await initApplication()
    repository = app.locals.legacyDependenciesContainer.scheduledEventsRepository
    worksheetRepository = app.locals.diContainer.resolve('legacyWorksheetRepository')
  })

  describe('addScheduledMeetingEvent', () => {
    it('schedules meeting for worksheet', async () => {
      await worksheetRepository.save({
        id: 'test-worksheet-id',
        relatedBuildingIds: [ 'test-building-id' ],
        relatedOwnerIds: [ 'test-owner-id' ],
        status: WorkSheetStatus.DEFAULT
      })

      const createdEvent = await repository.addScheduledMeetingEvent(
        {
          createdBy: 'user-id',
          notifyTo: 'user-id',
          event: {
            buildingId: 'test-building-id',
            contactId: 'test-contact-id',
            worksheetId: 'test-worksheet-id',
            ownerId: 'test-owner-id'
          },
          notifyAt: '2020-11-14T08:00:00.000Z',
          eventDate: '2020-11-14T08:00:00.000Z'
        },
        'user-id'
      )

      expect(createdEvent.id).to.not.be.empty
    })
  })
})
