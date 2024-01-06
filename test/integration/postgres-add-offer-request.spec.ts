import { AddOfferRequestService } from '../../src/building/service/add-offer-request.service'
import { expect } from 'chai'
import { AddContactService } from '../../src/owner/service/add-contact.service'
import { AddFlipperService } from '../../src/flipper/service/add-flipper.service'
import { AddOwnerService } from '../../src/owner/service/add-owner.service'
import { BuildingsRepository } from '../../src/building/repository/buildings.repository'
import type { ScheduleCallService } from '../../src/scheduled-events/service/schedule-call.service'
import { ScheduledEventsRepository } from '../../src/scheduled-events/repository/schedule-events.repository'
import { createTestContainer } from '../create-test-container'
import { buildingFactory, userFactory } from '../factories'
import { addCaller, createOwnerWithEmailContact } from '../helpers'
import { AddOperatorService } from '../../src/user/service/add-operator.service'
import { ListBuildingsService } from '../../src/building/service/list-buildings.service'
import { ScheduledCallsService } from '../../src/scheduled-events/service/scheduled-calls.service'

describe('Add offer request (Integration)', () => {
  it('adds offer request', async () => {
    const deps = await buildDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testEmailContact ] = await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())
    const testCaller = await addCaller(deps)
    const testCmd = {
      ownerId: testOwner.id,
      destinationContactId: testEmailContact.id,
      reporterContactId: testEmailContact.id,
      buildingId: testBuilding.id,
      flipperId: testFlipper.id,
      callerId: testCaller.callerId,
      note: 'test-note'
    }

    await deps.addOfferRequestService.addOfferRequest(testCmd)

    const updatedBuilding = await deps.buildingsRepository.get(testBuilding.id)
    expect(updatedBuilding.assignedAgentId).to.be.equal(testFlipper.id)

    const flipperNegotiations = await deps.listBuildingsService.buildingsOfId([ testBuilding.id ])
    expect(flipperNegotiations).to.be.lengthOf(1)
    expect(flipperNegotiations[ 0 ].lastMeeting).to.include({ inPerson: false })

    const flipperScheduledCalls = await deps.scheduledCallsService.scheduledCallsFor(testFlipper.user.id)
    expect(flipperScheduledCalls).to.be.lengthOf(1)
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
  scheduleCallService: ScheduleCallService,
  scheduledCallsService: ScheduledCallsService,
  scheduledEventsRepository: ScheduledEventsRepository,
}> {
  const diContainer = await createTestContainer({ postgres: true, couchbase: false })

  return {
    addOfferRequestService: diContainer.resolve('addOfferRequestService'),
    addOperatorService: diContainer.resolve('addOperatorService'),
    listBuildingsService: diContainer.resolve('listBuildingsService'),

    addContactService: diContainer.resolve('addContactService'),
    addFlipperService: diContainer.resolve('addFlipperService'),
    addOwnerService: diContainer.resolve('addOwnerService'),
    buildingsRepository: diContainer.resolve('buildingsRepository'),
    scheduleCallService: diContainer.resolve('scheduleCall'),
    scheduledCallsService: diContainer.resolve('scheduledCallsService'),
    scheduledEventsRepository: diContainer.resolve('scheduledEventsRepository'),
  }
}
