import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { Portugal2021BuildingsRepository } from '../../../src/building/repository/portugal2021-buildings.repository'

describe('Portugal2021BuildingsRepository', () => {
  let repository: Portugal2021BuildingsRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('portugal2021BuildingsRepository')
  })

  it('creates repository', () => {
    expect(repository).to.be.ok
  })
})

