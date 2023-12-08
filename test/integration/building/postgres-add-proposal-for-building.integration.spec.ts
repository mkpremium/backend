import { expect } from 'chai'
import { createTestApp } from '../create-test-app'
import { ownerBuilder } from '../../owner/owner.builder'
import { buildingBuilder } from '../../building/building.builder'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import moment from 'moment'
import { contactOfId } from '../../../src/owner/owner'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import uuid from 'uuid/v4'
import { FlipperRepository } from '../../../src/flipper/flipper.repository'
import { Factory } from 'rosie'
import { ContactsRepository } from '../../../src/contacts/contacs.repository'

describe.skip('AddProposalForBuilding - Integration (Postgres)', () => {
  it('saves proposal for building', async () => {
    const {
      addProposalForBuildingService,
      ownersRepository,
      buildingsRepository,
      flippersRepository,
      buildingsReadRepository,
      contactsRepository,
    } = await buildDependencies()

    const [ testBuilding, testOwner, testEmailContact, testFlipper ] = await Promise.all([
      buildingsRepository.save(buildingBuilder({ id: uuid() }).build()),
      ownersRepository.save(ownerBuilder({ id: uuid() }).build()),
      contactsRepository.save(Factory.build('email-contact')),
      flippersRepository.save(Factory.build('flipper')),
    ])

    const testCmd = {
      buildingId: testBuilding.id,
      ownerId: testOwner.id,
      amount: 1000,
      contactId: testEmailContact.id,
      createdBy: testFlipper.id,
      message: 'test email message'
    }

    await addProposalForBuildingService.add(testCmd.buildingId, testCmd)

    const proposals = await buildingsReadRepository.listProposalsForBuilding(testCmd.buildingId)
    expect(proposals).to.have.lengthOf(1)
    expect(proposals[ 0 ]).to.be.deep.contains({
      ownerId: testCmd.ownerId,
      createdBy: testCmd.createdBy,
      proposal: testCmd.amount,
      message: testCmd.message,
      notificationStatus: 'PENDING',
      notificationEmail: contactOfId(testOwner, testCmd.contactId).value,
    })
    expect(moment((proposals[ 0 ] as any).createdAt).isSame(moment(), 'day'))
      .to.be.true
  })
})


async function buildDependencies (): Promise<{
  addProposalForBuildingService: AddProposalForBuildingService,
  ownersRepository: OwnerRepository,
  buildingsRepository: BuildingsRepository,
  buildingsReadRepository: BuildingsReadRepository,
  flippersRepository: FlipperRepository,
  contactsRepository: ContactsRepository,
}> {
  const { locals: { diContainer } } = await createTestApp('postgres')

  return {
    addProposalForBuildingService: diContainer.resolve('addProposalForBuildingService'),
    ownersRepository: diContainer.resolve('ownersRepository'),
    buildingsRepository: diContainer.resolve('buildingsRepository'),
    flippersRepository: diContainer.resolve('flippersRepository'),
    buildingsReadRepository: diContainer.resolve('buildingsReadRepository'),
    contactsRepository: diContainer.resolve('contactsRepository'),
  }
}
