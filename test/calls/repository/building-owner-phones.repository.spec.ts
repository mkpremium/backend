import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { BuildingOwnerPhonesRepository } from '../../../src/calls/repository/building-owner-phones.repository'

describe('BuildingOwnerPhonesRepository', () => {
  let repository: BuildingOwnerPhonesRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('buildingOwnerPhonesRepository')
  })

  it('creates repository', () => {
    expect(repository).to.be.ok
  })
})

