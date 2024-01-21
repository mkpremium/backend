import { buildingFactory } from '../../factories'
import { expect } from 'chai'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { addCaller, createOwnerWithPhoneContact, resolveDependencies } from "../../helpers";

describe('SearchOwnerOrBuildingService', () => {
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

    const result = await deps.searchOwnerOrBuildingService.search(testPhoneContact.value)

    expect(result).to.have.lengthOf(1)
    expect(result[0].scheduledCalls).to.have.lengthOf(1)
    // expect(result[0].scheduledCalls.map(({id}) => id)).to.have.lengthOf(1)
  })
})
