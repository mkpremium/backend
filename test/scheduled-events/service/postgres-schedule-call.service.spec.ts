import type { ScheduleCallCommand } from '../../../src/scheduled-events/service/schedule-call.service'
import { createOwnerWithPhoneContact, resolveDependencies } from '../../helpers'
import { buildingFactory, userFactory, worksheetFactory } from '../../factories'
import { expect } from 'chai'

describe('PostgresScheduleCallService', () => {
  it('schedule a call', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    await deps.worksheetRepository.save(worksheetFactory.build(null, { buildingId: testBuilding.id }))
    const [testOwner, testPhoneContact] = await createOwnerWithPhoneContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())

    const cmd: ScheduleCallCommand = {
      event: {
        event: {
          ownerId: testOwner.id,
          contactId: testPhoneContact.id,
          buildingId: testBuilding.id,
          inPerson: false
        },
        notifyTo: testFlipper.user.id,
        eventDate: new Date().toISOString(),
        note: 'note'
      },
      userId: testFlipper.user.id
    }

    const actualScheduledCall = await deps.scheduleCallService.scheduleCall(cmd)

    expect(actualScheduledCall).to.not.be.null
    const lastScheduledEventForBuilding = await deps.postgresScheduledEventsRepository.lastScheduledEventForBuilding(testBuilding.id)
    expect(lastScheduledEventForBuilding).to.include({ id: actualScheduledCall.id, type: 'CALLS' })

    const flipperScheduledCalls = await deps.scheduledCallsService.scheduledCallsFor(testFlipper.user.id)
    expect(flipperScheduledCalls).to.have.lengthOf(1)
  })
})
