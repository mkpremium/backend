import { buildingFactory } from '../factories'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet/worksheet.builder'
import {
  addCaller,
  addEmailToOwner,
  addOfferRequest,
  createMeeting,
  createOwnerWithPhoneContact,
  resolveDependencies
} from '../helpers'
import { Factory } from 'rosie'

describe('Search owner or building by phone', () => {
  it('found owners with matching phone contact', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    await deps.worksheetRepository.save(worksheetBuilder({ relatedBuildingIds: [testBuilding.id] }).build())

    const [testOwner, testPhoneContact] = await createOwnerWithPhoneContact(testBuilding, deps)
    const testCallerUser = await addCaller(deps)
    await deps.scheduleCallService.scheduleCall({
      event: {
        event: {
          ownerId: testOwner.id,
          contactId: testPhoneContact.id,
          buildingId: testBuilding.id,
          inPerson: false
        },
        notifyTo: testCallerUser.id,
        eventDate: new Date().toISOString(),
        note: 'note'
      },
      userId: testCallerUser.id
    }
    )

    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))
    const testEmailContact = await addEmailToOwner(testOwner, deps)
    await addOfferRequest(testBuilding, testOwner, testEmailContact, testFlipper, testCallerUser, deps)

    let result = await deps.searchOwnerOrBuildingService.search(testPhoneContact.value)

    expect(result).to.have.lengthOf(1)
    expect(result[0].scheduledCalls).to.have.lengthOf(1)
    expect(result[0].lastEvent).to.include({ type: 'offer-request' },
      'Return last offer request as the last event')

    await createMeeting(testCallerUser, testFlipper, testEmailContact, testBuilding, testOwner, deps)
    result = await deps.searchOwnerOrBuildingService.search(testPhoneContact.value)

    expect(result[0].lastEvent).to.include({ type: 'meeting' },
      'Return last meeting as the last event')
  })
})
