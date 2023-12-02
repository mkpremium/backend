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

describe.skip('PostgresBuildingsRepository', () => {
  let buildingsRepository: BuildingsRepository & BuildingsReadRepository
  let ownersRepository: OwnerRepository
  let container: AwilixContainer

  beforeEach(async () => {
    container = await createTestContainer()
    buildingsRepository = container.resolve('postgresBuildingsRepository') as BuildingsRepository & BuildingsReadRepository
    ownersRepository = container.resolve('postgresOwnersRepository') as OwnerRepository
  })

  it('gets flipper leads', async () => {
    const assignedFlipperId = uuid()
    const featuredOwnerId = uuid()
    const ownerContactId = uuid()
    const worksheetId = uuid()
    const leadBuilding = buildingBuilder({
      id: uuid(),
      negotiationStatus: 'LEAD',
      assignedAgentId: assignedFlipperId,
      lead: {
        capturedAt: new Date(),
        ownerId: featuredOwnerId,
        contactId: ownerContactId,
        worksheetId: worksheetId,
      }
    }).build()
    const ownerLeadBuilding = ownerBuilder({ buildingId: leadBuilding.id, id: uuid() }).build()
    const otherBuilding = buildingBuilder({ assignedAgentId: assignedFlipperId, id: uuid() }).build()
    const ownerOtherBuilding = ownerBuilder({ buildingId: otherBuilding.id, id: uuid() }).build()

    await buildingsRepository.save(leadBuilding)
    await ownersRepository.save(ownerLeadBuilding)
    await buildingsRepository.save(otherBuilding)
    await ownersRepository.save(ownerOtherBuilding)

    return pipe(
      buildingsRepository.assignedToFlipperAndWithStatus(assignedFlipperId, 'LEAD'),
      map(buildings => {
        expect(buildings).to.have.lengthOf(1)
        expect(buildings[ 0 ].id).to.eql(leadBuilding.id)
        expect(buildings[ 0 ].lead).to.be.ok
      }),
      orFail()
    )()
  })
})
