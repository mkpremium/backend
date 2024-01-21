import { buildingFactory } from '../factories'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet/worksheet.builder'
import {
  addCaller,
  addEmailToOwner,
  addOfferRequest,
  createOwnerWithPhoneContact,
  resolveDependencies
} from "../helpers";
import { Factory } from "rosie";

describe('Search owner or building by phone', () => {
  it('found owners with matching phone contact', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    await deps.worksheetRepository.save(worksheetBuilder({ relatedBuildingIds: [ testBuilding.id ] }).build())

    const [testOwner, testPhoneContact] = await createOwnerWithPhoneContact(testBuilding, deps)
    const testCallerUser = await addCaller(deps)
    const scheduledCall = await deps.scheduleCallService.scheduleCall({
        event: {
          event: {
            ownerId: testOwner.id,
            contactId: testPhoneContact.id,
            buildingId: testBuilding.id,
            inPerson: false,
          },
          notifyTo: testCallerUser.id,
          eventDate: new Date().toISOString(),
          note: 'note',
        },
        userId: testCallerUser.id,
      }
    )

    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))
    const testEmailContact = await addEmailToOwner(testOwner, deps)
    await addOfferRequest(testBuilding, testOwner, testEmailContact, testFlipper, testCallerUser, deps)

    const result = await deps.searchOwnerOrBuildingService.search(testPhoneContact.value)

    expect(result).to.have.lengthOf(1)
    const foundBuilding = result[0];
    expect(foundBuilding.scheduledCalls).to.have.lengthOf(1)
    expect(foundBuilding.lastEvent).to.be.ok
  })
})
