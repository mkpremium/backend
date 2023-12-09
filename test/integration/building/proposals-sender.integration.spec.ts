import { ProposalsSenderService } from '../../../src/building/service/proposals-sender.service'
import { createTestContainer } from '../../create-test-container'
import sinon, { SinonFakeTimers, stub } from 'sinon'
import { asValue } from 'awilix'
import { expect } from 'chai'
import { buildingBuilder } from '../../building/building.builder'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { ownerBuilder } from '../../owner/owner.builder'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { UserProps } from '../../../src/types/user'
import { userBuilder } from '../../user/user.builder'
import moment from 'moment-timezone'
import { CouchbaseUsersRepository } from '../../../src/user/repository/couchbase-users.repository'

describe('ProposalsSenderService - Integration', () => {
  let service!: ProposalsSenderService
  let addProposalForBuildingService!: AddProposalForBuildingService
  let mailerSpy
  let clock: SinonFakeTimers
  const testBuilding = buildingBuilder({ cadastre: { reference: '123456789' } }).build()
  const testOwner = ownerBuilder({ buildingId: testBuilding.id }).withEmailContact('test-email-id').build()
  const testCaller: UserProps = userBuilder().build()

  beforeEach(async () => {
    const container = await createTestContainer()
    mailerSpy = {
      sendMail: stub()
    }
    const lastMondayMorning = moment().startOf('isoWeek').hours(9).minutes(0)
    clock = sinon.useFakeTimers(lastMondayMorning.toDate())
    container.register('emailTransport', asValue(mailerSpy))

    service = container.resolve('proposalsSenderService')
    addProposalForBuildingService = container.resolve('addProposalForBuildingService')

    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const ownersRepository = container.resolve('ownersRepository') as OwnerRepository
    const couchbaseUsersRepository = container.resolve('couchbaseUsersRepository') as CouchbaseUsersRepository
    await couchbaseUsersRepository.save(testCaller)
    await ownersRepository.save(testOwner)
    await buildingsRepository.save(testBuilding)
  })

  afterEach(() => clock.restore())

  it('sends emails older than 3 days', async () => {
    mailerSpy.sendMail.resolves()
    const testAddProposalCmd = {
      amount: 100000,
      ownerId: testOwner.id,
      contactId: 'test-email-id',
      createdBy: testCaller.id,
    }

    await addProposalForBuildingService.add(testBuilding.id, testAddProposalCmd)
    await service.checkAndSendProposals()

    expect(mailerSpy.sendMail).to.have.been.called
  })
})
