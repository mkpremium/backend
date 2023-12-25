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
import { addProposal, createOwnerWithEmailContact } from '../../worksheet/helpers'

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

    const testBuilding = await buildingsRepository.save(buildingBuilder().build())
    const [ testOwner, testEmailContact ] =
      await createOwnerWithEmailContact(testBuilding, addOwnerService, addContactService)
    const testFlipper = await addFlipperService.addFlipper(Factory.build('user'))

    const addProposalCmd =
      await addProposal(testBuilding, testOwner, testEmailContact, testFlipper, addProposalForBuildingService)

    const proposals = await buildingsReadRepository.listProposalsForBuilding(testBuilding.id)
    expect(proposals).to.have.lengthOf(1)
    expect(proposals[ 0 ]).to.be.deep.contains({
      ownerId: testOwner.id,
      createdBy: testFlipper.user.id,
      message: 'test email message',
      notificationStatus: 'PENDING',
      notificationEmail: testEmailContact.value,
    })
    expect((proposals[ 0 ] as ProposalProps).proposal).to.be.closeTo(addProposalCmd.amount, 0.001)
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
