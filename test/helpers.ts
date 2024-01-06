import * as TE from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { BuildingProps } from '../src/building/building'
import { ContactProps } from '../src/owner/owner'
import { Flipper } from '../src/flipper/flipper.entity'
import { AddProposalForBuildingService } from '../src/building/service/add-proposal-for-building.service'
import { MaybeFeaturedContact } from '../src/owner/service/add-contact.service'
import { Owner } from '../src/owner/owner.entity'
import { emailContactFactory, phoneContactFactory } from './factories'
import { AddOperatorService } from '../src/user/service/add-operator.service'
import { Factory } from 'rosie'
import { UserProfileProps } from '../src/types/user'

export function orFail () {
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

export async function createOwnerWithPhoneContact (
  testBuilding: Pick<BuildingProps, 'id'>, { addOwnerService, addContactService }) {
  const testOwner = await createOwner(testBuilding, { addOwnerService })
  const testPhoneContact = await addContactService.addContact({
    ...phoneContactFactory.build(),
    isFeatured: true,
    ownerId: testOwner.id,
  }) as MaybeFeaturedContact

  return [ testOwner, testPhoneContact ] as [ Owner, MaybeFeaturedContact ]
}

export async function createOwnerWithEmailContact (
  testBuilding: Pick<BuildingProps, 'id'>, { addOwnerService, addContactService }) {
  const testOwner = await createOwner(testBuilding, { addOwnerService })
  const testEmailContact = await addContactService.addContact({
    ...emailContactFactory.build(),
    isFeatured: true,
    ownerId: testOwner.id,
  }) as MaybeFeaturedContact

  return [ testOwner, testEmailContact ] as [ Owner, MaybeFeaturedContact ]
}

async function createOwner (testBuilding: Pick<BuildingProps, 'id'>, { addOwnerService }) {
  return await addOwnerService.addOwner({
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
}

export async function addCaller ({ addOperatorService }: { addOperatorService: AddOperatorService }) {
  return addUserWithRole(addOperatorService, 'OPERATOR')
}

export async function addUserWithRole (service: AddOperatorService, role: 'BUSINESS' | 'OPERATOR') {
  const testCommand = {
    ...Factory.build<{ username: string, password: string }>('user-credentials'),
    profile: Factory.build<UserProfileProps>('user-profile'),
    roles: [ role ],
    enable: true,
  }
  return await service.addOperator(testCommand, { id: 'admin' })
}
