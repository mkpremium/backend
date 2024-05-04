import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { AwilixContainer } from 'awilix'
import { createTestContainer } from '../../create-test-container'
import { buildingBuilder } from '../building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { orFail } from '../../helpers'
import uuid from 'uuid/v4'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import { FlipperRepository } from '../../../src/flipper/flipper.repository'
import { flipperFactory } from '../../factories'

describe('Lead assignment to flipper (Postgres)', () => {
  let buildingsRepository: BuildingsRepository & BuildingsReadRepository
  let ownersRepository: OwnerRepository
  let flippersRepository: FlipperRepository
  let container: AwilixContainer

  beforeEach(async () => {
    container = await createTestContainer()
    buildingsRepository = container.resolve('buildingsRepository')
    ownersRepository = container.resolve('ownersRepository')
    flippersRepository = container.resolve('flippersRepository')
  })

  it('gets flipper leads', async () => {
    const featuredOwnerId = uuid()
    const ownerContactId = uuid()
    const worksheetId = uuid()

    const flipper = await flippersRepository.save(flipperFactory.build())
    const leadBuilding = buildingBuilder({
      negotiationStatus: 'LEAD',
      assignedAgentId: flipper.id,
      lead: {
        capturedAt: new Date(),
        ownerId: featuredOwnerId,
        contactId: ownerContactId,
        worksheetId
      }
    }).build()
    const ownerLeadBuilding = await ownersRepository.save(ownerBuilder().build())
    const otherBuilding = buildingBuilder({ assignedAgentId: flipper.id, id: uuid() }).build()
    const ownerOtherBuilding = ownerBuilder({ buildingId: otherBuilding.id, id: uuid() }).build()

    await buildingsRepository.save(leadBuilding)
    await ownersRepository.save(ownerLeadBuilding)
    await buildingsRepository.save(otherBuilding)
    await ownersRepository.save(ownerOtherBuilding)

    return pipe(
      buildingsRepository.assignedToFlipperAndWithStatus(flipper.id, 'LEAD'),
      map(buildings => {
        expect(buildings).to.have.lengthOf(1)
        expect(buildings[0].id).to.eql(leadBuilding.id)
        expect(buildings[0].lead).to.be.ok
      }),
      orFail()
    )()
  })
})
