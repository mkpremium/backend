import * as TE from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { BuildingProps } from '../src/building/building'
import { ContactProps } from '../src/owner/owner'
import { Flipper } from '../src/flipper/flipper.entity'
import { AddProposalForBuildingService } from '../src/building/service/add-proposal-for-building.service'
import { AddOwnerService } from '../src/owner/service/add-owner.service'
import { AddContactService, MaybeFeaturedContact } from '../src/owner/service/add-contact.service'
import { Factory } from 'rosie'
import { Owner } from '../src/owner/owner.entity'

export function orFail() {
  return TE.orElse((error) => {
    expect.fail(String(error))
  })
}

export async function addProposal (testBuilding: BuildingProps, testOwner: {
  id: string
}, testEmailContact: ContactProps & {
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

  return testAddProposalCommand
}

export async function createOwnerWithEmailContact (
  testBuilding: BuildingProps, { addOwnerService, addContactService }) {
  const testOwner = await addOwnerService.addOwner({
    status: 'VERIFICADO',
    buildingId: testBuilding.id,
    note: 'test note',
    type: 'PRINCIPAL',
    person: {
      name: 'Full Name',
      firstName: 'Full',
      firstSurname: 'Name',
      contacts: []
    }
  }, 'test-requester-id')
  const testEmailContact = await addContactService.addContact({
    ...Factory.build('email-contact'),
    isFeatured: true,
    ownerId: testOwner.id
  }) as MaybeFeaturedContact

  return [ testOwner, testEmailContact ] as [ Owner, MaybeFeaturedContact ]
}
