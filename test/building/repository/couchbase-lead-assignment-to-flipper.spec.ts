import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { buildingBuilder } from '../building.builder'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { orFail } from '../../helpers'
import { ownerBuilder } from '../../owner/owner.builder'
import { AwilixContainer } from 'awilix'
import { CouchbaseBuildingsReadRepository } from '../../../src/building/repository/couchbase-buildings-read.repository'
import { CouchbaseBuildingsRepository } from '../../../src/building/repository/couchbase-building.repository'
import { CouchbaseOwnersRepository } from '../../../src/owner/repository/couchbase-owners.repository'

describe('Lead assignment to flipper (Couchbase)', () => {
  let readRepository: CouchbaseBuildingsReadRepository
  let writeRepository: CouchbaseBuildingsRepository
  let ownersRepository: CouchbaseOwnersRepository
  let container: AwilixContainer

  beforeEach(async () => {
    container = await createTestContainer({ postgres: false, couchbase: true })
    writeRepository = container.resolve('couchbaseBuildingsRepository') as CouchbaseBuildingsRepository
    readRepository = container.resolve('couchbaseBuildingsReadRepository') as CouchbaseBuildingsReadRepository
    ownersRepository = container.resolve('couchbaseOwnersRepository') as CouchbaseOwnersRepository
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
        worksheetId: 'test-worksheet-id'
      }
    }).build()
    const ownerLeadBuilding = ownerBuilder({ buildingId: leadBuilding.id, id: 'test-lead-owner' }).build()
    const otherBuilding = buildingBuilder({ id: 'other-building', assignedAgentId: 'test-flipper-id' }).build()
    const ownerOtherBuilding = ownerBuilder({ buildingId: otherBuilding.id, id: 'test-other-owner' }).build()

    await writeRepository.save(leadBuilding)
    await ownersRepository.save(ownerLeadBuilding)
    await writeRepository.save(otherBuilding)
    await ownersRepository.save(ownerOtherBuilding)

    return pipe(
      readRepository.assignedToFlipperAndWithStatus('test-flipper-id', 'LEAD'),
      map(buildings => {
        expect(buildings).to.have.lengthOf(1)
        expect(buildings[0].id).to.eql('test-lead-building')
        expect(buildings[0].lead).to.be.ok
      }),
      orFail()
    )()
  })

  it('searches building by its cadastre reference', async () => {
    const testCadastreReference = 'test-cadastre-reference'
    const testBuilding = buildingBuilder({ cadastre: { reference: testCadastreReference } }).build()
    await writeRepository.save(testBuilding)
    await ownersRepository.save(ownerBuilder({ buildingId: testBuilding.id }).build())

    await pipe(
      readRepository.ofCadastreReference(testCadastreReference),
      map(foundBuilding => {
        expect(foundBuilding.id).to.be.equal(testBuilding.id)
      }),
      orFail()
    )()
  })
})
