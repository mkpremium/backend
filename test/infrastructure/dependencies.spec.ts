import { createDiContainer, setupContainer } from '../../src/infrastructure/dependencies'
import { expect } from 'chai'
import { createContainer } from 'awilix'

describe('createDiContainer', () => {
  it('resolves all registered dependencies', () => {
    const container = createContainer()
    setupContainer(container, null, null, false)
    for (const serviceName in container.registrations) {
      expect(() => container.resolve(serviceName)).to.not.throw
    }
  })
})
