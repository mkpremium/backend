import { createDiContainer } from '../../src/infrastructure/dependencies'
import { expect } from 'chai'

describe('createDiContainer', () => {
  it('resolves all registered dependencies', () => {
    const container = createDiContainer(null)
    for (const serviceName in container.registrations) {
      expect(() => container.resolve(serviceName)).to.not.throw
    }
  })
})
