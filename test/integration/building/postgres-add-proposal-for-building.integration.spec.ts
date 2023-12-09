import { expect } from 'chai'
import { createTestApp } from '../create-test-app'
import { buildingBuilder } from '../../building/building.builder'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import moment from 'moment'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import uuid from 'uuid/v4'
import { Factory } from 'rosie'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { AddContactService, MaybeFeaturedContact } from '../../../src/owner/service/add-contact.service'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { ProposalProps } from '../../../src/building/building'

describe('AddProposalForBuilding - Integration (Postgres)', () => {
  it('saves proposal for building', async () => {
    const {
      addContactService,
      addOwnerService,
      addProposalForBuildingService,
      buildingsRepository,
      addFlipperService,
      buildingsReadRepository,
    } = await buildDependencies()

    const testBuilding = await buildingsRepository.save(buildingBuilder({ id: uuid() }).build())
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
    })
    const testEmailContact = await addContactService.addContact({
      ...Factory.build('email-contact'),
      isFeatured: true,
      ownerId: testOwner.id
    }) as MaybeFeaturedContact
    const testFlipper = await addFlipperService.addFlipper(Factory.build('user'))

    const testCmd = {
      buildingId: testBuilding.id,
      ownerId: testOwner.id,
      amount: 1000,
      contactId: testEmailContact.id,
      createdBy: testFlipper.user.id,
      message: 'test email message'
    }

    await addProposalForBuildingService.add(testCmd.buildingId, testCmd)

    const proposals = await buildingsReadRepository.listProposalsForBuilding(testCmd.buildingId)
    expect(proposals).to.have.lengthOf(1)
    expect(proposals[ 0 ]).to.be.deep.contains({
      ownerId: testCmd.ownerId,
      createdBy: testCmd.createdBy,
      message: testCmd.message,
      notificationStatus: 'PENDING',
      notificationEmail: testEmailContact.value,
    })
    expect((proposals[0] as ProposalProps).proposal).to.be.closeTo(testCmd.amount, 0.001)
    expect(moment((proposals[ 0 ] as any).createdAt).isSame(moment(), 'day'))
      .to.be.true
  })
})


async function buildDependencies (): Promise<{
  addContactService: AddContactService,
  addOwnerService: AddOwnerService,
  addProposalForBuildingService: AddProposalForBuildingService,
  ownersRepository: OwnerRepository,
  buildingsRepository: BuildingsRepository,
  buildingsReadRepository: BuildingsReadRepository,
  addFlipperService: AddFlipperService,
}> {
  const { locals: { diContainer } } = await createTestApp('postgres')

  return {
    addContactService: diContainer.resolve('addContactService'),
    addProposalForBuildingService: diContainer.resolve('addProposalForBuildingService'),
    addOwnerService: diContainer.resolve('addOwnerService'),

    ownersRepository: diContainer.resolve('ownersRepository'),
    buildingsRepository: diContainer.resolve('buildingsRepository'),
    addFlipperService: diContainer.resolve('addFlipperService'),
    buildingsReadRepository: diContainer.resolve('buildingsReadRepository'),
  }
}
