import { expect } from 'chai'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { createTestContainer } from '../../create-test-container'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { buildingBuilder } from '../../building/building.builder'
import uuid from 'uuid/v4'

describe('AddOwnerService Postgres', () => {
  let buildingsRepository: BuildingsRepository
  let service: AddOwnerService

  beforeEach(async () => {

    const container = await createTestContainer({ couchbase: false, postgres: true })
    buildingsRepository = container.resolve('buildingsRepository')
    service = container.resolve('addOwnerService')
  })

  it('saves all corresponding data', async () => {
    const testBuilding = await buildingsRepository.save(buildingBuilder({ id: uuid() }).build())
    const actualOwner = await service.addOwner({
      status: 'VERIFICADO',
      buildingId: testBuilding.id,
      note: 'test note',
      type: 'PRINCIPAL',
      person: {
        name: 'Full Name',
        firstName: 'Full',
        firstSurname: 'Name',
        contacts: [
          {
            status: 'GOOD',
            type: 'EMAIL',
            value: 'test@email.org'
          }
        ]
      }
    }, 'test-requester-id')

    expect(actualOwner.id).to.exist
  })
})
