import { expect } from 'chai'
import { createTestApp } from '../create-test-app'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import moment from 'moment'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import { Factory } from 'rosie'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { ProposalProps } from '../../../src/building/building'
import { addProposal, createOwnerWithEmailContact } from '../../helpers'
import { buildingFactory } from '../../factories'

describe('AddProposalForBuilding - Integration (Postgres)', () => {
  it('saves proposal for building', async () => {
    const deps = await buildDependencies()

    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testEmailContact ] =
      await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))

    const addProposalCmd =
      await addProposal(testBuilding, testOwner, testEmailContact, testFlipper, deps)

    const proposals = await deps.buildingsReadRepository.listProposalsForBuilding(testBuilding.id)
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
