import { createTestContainer } from '../../create-test-container'
import type {
  ScheduleCallCommand,
  ScheduleCallService
} from '../../../src/scheduled-events/service/schedule-call.service'
import { createOwnerWithPhoneContact } from '../../helpers'
import { buildingFactory, userFactory } from '../../factories'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { expect } from 'chai'
import {
  PostgresScheduledEventsRepository
} from '../../../src/scheduled-events/repository/postgres-schedule-events.repository'
import { ScheduledCallsService } from "../../../src/scheduled-events/service/scheduled-calls.service";

describe('PostgresScheduleCallService', () => {
  it('schedule a call', async () => {
    const deps = await buildDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testPhoneContact ] = await createOwnerWithPhoneContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())

    const cmd: ScheduleCallCommand = {
      event: {
        event: {
          ownerId: testOwner.id,
          contactId: testPhoneContact.id,
          buildingId: testBuilding.id,
          inPerson: false,
        },
        notifyTo: testFlipper.user.id,
        eventDate: new Date().toISOString(),
        note: 'note',
      },
      userId: testFlipper.user.id,
    }

    const actualScheduledCall = await deps.scheduleCallService.scheduleCall(cmd)

    expect(actualScheduledCall).to.not.be.null
    const lastScheduledEventForBuilding = await deps.postgresScheduledEventsRepository.lastScheduledEventForBuilding(testBuilding.id)
    expect(lastScheduledEventForBuilding).to.include({ id: actualScheduledCall.id, type: 'CALLS' })

    const flipperScheduledCalls = await deps.scheduledCallsService.scheduledCallsFor(testFlipper.user.id);
    expect(flipperScheduledCalls).to.have.lengthOf(1)
  })
})

async function buildDependencies (): Promise<{
  addContactService: AddContactService,
  addFlipperService: AddFlipperService,
  addOwnerService: AddOwnerService,
  buildingsRepository: BuildingsRepository,
  scheduleCallService: ScheduleCallService,
  scheduledCallsService: ScheduledCallsService,
  postgresScheduledEventsRepository: PostgresScheduledEventsRepository,
}> {
  const diContainer = await createTestContainer({ postgres: true, couchbase: false })

  return {
    addContactService: diContainer.resolve('addContactService'),
    addFlipperService: diContainer.resolve('addFlipperService'),
    addOwnerService: diContainer.resolve('addOwnerService'),
    buildingsRepository: diContainer.resolve('buildingsRepository'),
    scheduleCallService: diContainer.resolve('scheduleCall'),
    scheduledCallsService: diContainer.resolve('scheduledCallsService'),
    postgresScheduledEventsRepository: diContainer.resolve('postgresScheduledEventsRepository'),
  }
}
