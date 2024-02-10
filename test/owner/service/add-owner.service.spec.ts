import { expect } from 'chai'
import { AddOwnerService, conflictContactStatusPolicy } from '../../../src/owner/service/add-owner.service'
import { createTestContainer } from '../../create-test-container'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { buildingBuilder } from '../../building/building.builder'

describe('AddOwnerService Postgres', () => {
  let buildingsRepository: BuildingsRepository
  let service: AddOwnerService

  beforeEach(async () => {
    const container = await createTestContainer()
    buildingsRepository = container.resolve('buildingsRepository')
    service = container.resolve('addOwnerService')
  })

  it('saves all corresponding data', async () => {
    const testBuilding = await buildingsRepository.save(buildingBuilder().build())
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
    expect(actualOwner.person.contacts).to.have.lengthOf(1)
  })

  describe('contact status selector policy', () => {
    it('selects between different statuses', () => {
      expect(conflictContactStatusPolicy(['UNDEFINED', 'BAD']))
        .to.be.equal('BAD')
      expect(conflictContactStatusPolicy(['BAD', 'UNDEFINED']))
        .to.be.equal('BAD')
      expect(conflictContactStatusPolicy(['BAD', 'GOOD']))
        .to.be.equal('UNDEFINED')
      expect(conflictContactStatusPolicy(['BAD', 'GOOD', 'UNDEFINED']))
        .to.be.equal('UNDEFINED')
    })
  })
})
