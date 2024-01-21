import { buildingFactory, userFactory } from '../factories'
import { addCaller, createOwnerWithEmailContact, resolveDependencies } from '../helpers'
import { expect } from 'chai'

describe('Add meeting (Integration - Postgres)', () => {
  it.skip('adds meeting', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testEmailContact ] = await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())
    const testCaller = await addCaller(deps)

    const testCmd = {
      createdBy: testCaller.id,
      notifyTo: testFlipper.user.id,
      event: {
        contactId: testEmailContact.id,
        buildingId: testBuilding.id,
        ownerId: testOwner.id,
        eventAddress: '',
        worksheetId: undefined,
      },
      eventDate: new Date()
    }

    await deps.createMeetingService.createMeeting({ roles: [], id: '' }, testCmd)

    const flipperNegotiations = await deps.listBuildingsService.buildingsAssignedTo(testFlipper.user.id)
    expect(flipperNegotiations).to.be.lengthOf(1)
    expect(flipperNegotiations[ 0 ].lastMeeting).to.include({ inPerson: false })
  })
})
