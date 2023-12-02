import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { AwilixContainer } from 'awilix'
import { createTestContainer } from '../../create-test-container'
import { buildingBuilder } from '../building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { orFail } from '../../helpers'
import { PostgresBuildingsRepository } from '../../../src/building/repository/postgres-buildings.repository'

describe('PostgresBuildingsRepository', () => {
  let buildingsRepository: PostgresBuildingsRepository
  let ownersRepository: OwnerRepository
  let container: AwilixContainer

  beforeEach(async () => {
    container = await createTestContainer()
    buildingsRepository = container.resolve('postgresBuildingsRepository') as PostgresBuildingsRepository
    ownersRepository = container.resolve('ownersRepository') as OwnerRepository
  })

  it('gets flipper leads', async () => {
    const leadBuilding = buildingBuilder({
      id: 'test-lead-building',
      negotiationStatus: 'LEAD',
      assignedAgentId: 'test-flipper-id',
      lead: {
        capturedAt: new Date(),
        ownerId: 'test-owner-id',
        contactId: 'test-contact-id',
        worksheetId: 'test-worksheet-id',
      }
    }).build()
    const ownerLeadBuilding = ownerBuilder({ buildingId: leadBuilding.id, id: 'test-lead-owner' }).build()
    const otherBuilding = buildingBuilder({ id: 'other-building', assignedAgentId: 'test-flipper-id' }).build()
    const ownerOtherBuilding = ownerBuilder({ buildingId: otherBuilding.id, id: 'test-other-owner' }).build()

    await buildingsRepository.create(leadBuilding)
    await ownersRepository.save(ownerLeadBuilding)
    await buildingsRepository.save(otherBuilding)
    await ownersRepository.save(ownerOtherBuilding)

    return pipe(
      buildingsRepository.assignedToFlipperAndWithStatus('test-flipper-id', 'LEAD'),
      map(buildings => {
        expect(buildings).to.have.lengthOf(1)
        expect(buildings[ 0 ].id).to.eql('test-lead-building')
        expect(buildings[ 0 ].lead).to.be.ok
      }),
      orFail()
    )()
  })
})
