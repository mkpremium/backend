import { expect } from 'chai'
import { buildingFactory, userFactory } from '../factories'
import { addCaller, createOwnerWithEmailContact, resolveDependencies } from '../helpers'

describe('Add offer request (Integration)', () => {
  it('adds offer request', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testEmailContact ] = await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())
    const testCaller = await addCaller(deps)
    const testCmd = {
      ownerId: testOwner.id,
      destinationContactId: testEmailContact.id,
      reporterContactId: testEmailContact.id,
      buildingId: testBuilding.id,
      flipperId: testFlipper.user.id,
      callerId: testCaller.id, // caller's user ID
      note: 'test-note'
    }

    await deps.addOfferRequestService.addOfferRequest(testCmd)

    const updatedBuilding = await deps.buildingsRepository.get(testBuilding.id)
    expect(updatedBuilding.assignedAgentId).to.be.equal(testFlipper.id)

    const flipperNegotiations = await deps.listBuildingsService.buildingsAssignedTo(testFlipper.user.id)
    expect(flipperNegotiations).to.be.lengthOf(1)
    expect(flipperNegotiations[ 0 ].lastMeeting).to.include({ inPerson: false })
  })
})
