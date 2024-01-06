import { createTestContainer } from '../../create-test-container'
import { ScheduleCallService } from '../../../src/scheduled-events/service/schedule-call.service'
import { createOwnerWithPhoneContact } from '../../helpers'
import { buildingFactory, userFactory } from '../../factories'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { ScheduledEventsRepository } from '../../../src/scheduled-events/repository/schedule-events.repository'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { expect } from 'chai'

describe.skip('PostgresScheduleCallService', () => {
  it('schedule a call', async () => {
    const deps = await buildDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testPhoneContact ] = await createOwnerWithPhoneContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())

    const cmd = {
      event: {
        event: {
          ownerId: testOwner.id,
          contactId: testPhoneContact.id,
          buildingId: testBuilding.id,
          callAt: new Date(),
        },
        note: 'note',
      },
      userId: testFlipper.user.id,
    }

    const actualScheduledCall = await deps.scheduleCallService.scheduleCall(cmd as any)

    expect(await deps.scheduledEventsRepository.lastScheduledEventForBuilding(testBuilding.id)).to.eql({ id: actualScheduledCall.id })
  })
})

async function buildDependencies (): Promise<{
  addContactService: AddContactService,
  addFlipperService: AddFlipperService,
  addOwnerService: AddOwnerService,
  buildingsRepository: BuildingsRepository,
  scheduleCallService: ScheduleCallService,
  scheduledEventsRepository: ScheduledEventsRepository,
}> {
  const diContainer = await createTestContainer({ postgres: true, couchbase: false })

  return {
    addContactService: diContainer.resolve('addContactService'),
    addFlipperService: diContainer.resolve('addFlipperService'),
    addOwnerService: diContainer.resolve('addOwnerService'),
    buildingsRepository: diContainer.resolve('buildingsRepository'),
    scheduleCallService: diContainer.resolve('scheduleCall'),
    scheduledEventsRepository: diContainer.resolve('scheduledEventsRepository'),
  }
}
