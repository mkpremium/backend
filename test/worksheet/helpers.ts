import { BuildingProps } from '../../src/building/building'
import { ContactProps } from '../../src/owner/owner'
import { Flipper } from '../../src/flipper/flipper.entity'
import { AddProposalForBuildingService } from '../../src/building/service/add-proposal-for-building.service'

export async function addProposal (testBuilding: BuildingProps, testOwner: { id: string }, testEmailContact: ContactProps & {
  isFeatured: boolean
}, testFlipper: Flipper, addProposalForBuildingService: AddProposalForBuildingService) {
  const testAddProposalCommand = {
    buildingId: testBuilding.id,
    ownerId: testOwner.id,
    amount: 1_000,
    contactId: testEmailContact.id,
    createdBy: testFlipper.user.id,
    message: 'test email message'
  }
  await addProposalForBuildingService.add(testBuilding.id, testAddProposalCommand)
}
