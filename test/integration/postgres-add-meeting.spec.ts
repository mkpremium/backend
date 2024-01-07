import { AddOfferRequestService } from '../../src/building/service/add-offer-request.service'
import { AddOperatorService } from '../../src/user/service/add-operator.service'
import { ListBuildingsService } from '../../src/building/service/list-buildings.service'
import { AddContactService } from '../../src/owner/service/add-contact.service'
import { AddFlipperService } from '../../src/flipper/service/add-flipper.service'
import { AddOwnerService } from '../../src/owner/service/add-owner.service'
import { BuildingsRepository } from '../../src/building/repository/buildings.repository'
import { ScheduledEventsRepository } from '../../src/scheduled-events/repository/schedule-events.repository'
import { createTestContainer } from '../create-test-container'
import { MeetingsService } from '../../src/scheduled-events/service/meetings.service'
import { CreateMeetingService } from '../../src/scheduled-events/service/create-meeting.service'

describe.skip('Add meeting (Integration - Postgres)', () => {
  it('adds meeting', async () => {
    const deps = await buildDependencies()

    await deps.createMeetingService.createMeeting({roles: []}, {
        createdBy: 'testCallerId',
        notifyTo: 'testAssignedFlipperId',
        event: {
          contactId: 'test-contact-id',
          eventAddress: 'test meeting adddress',
          ownerId: 'test-owner-id',
          worksheetId: 'test-worksheet-id',
          buildingId: 'test-building-id'
        },
        notifyAt: 'testMeetingAt',
        eventDate: 'testMeetingAt'
      }
    )

  })
})

async function buildDependencies (): Promise<{
  addOfferRequestService: AddOfferRequestService,
  addOperatorService: AddOperatorService,
  listBuildingsService: ListBuildingsService,

  addContactService: AddContactService,
  addFlipperService: AddFlipperService,
  addOwnerService: AddOwnerService,
  buildingsRepository: BuildingsRepository,
  scheduledEventsRepository: ScheduledEventsRepository,
  createMeetingService: CreateMeetingService,
  meetingsService: MeetingsService,
}> {
  const diContainer = await createTestContainer({ postgres: true, couchbase: false })

  return {
    addOfferRequestService: diContainer.resolve('addOfferRequestService'),
    addOperatorService: diContainer.resolve('addOperatorService'),
    listBuildingsService: diContainer.resolve('listBuildingsService'),
    createMeetingService: diContainer.resolve('createMeetingService'),
    meetingsService: diContainer.resolve('meetingsService'),

    addContactService: diContainer.resolve('addContactService'),
    addFlipperService: diContainer.resolve('addFlipperService'),
    addOwnerService: diContainer.resolve('addOwnerService'),
    buildingsRepository: diContainer.resolve('buildingsRepository'),
    scheduledEventsRepository: diContainer.resolve('scheduledEventsRepository'),
  }
}
