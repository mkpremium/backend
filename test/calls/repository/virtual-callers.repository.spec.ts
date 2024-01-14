import { expect } from 'chai'
import { VirtualCallersRepository } from '../../../src/calls/repository/virtual-callers.repository'
import { createTestContainer } from '../../create-test-container'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe.skip('VirtualCallersRepository', () => {
  let repository: VirtualCallersRepository

  beforeEach(async () => {
    const container = await createTestContainer()

    repository = container.resolve('virtualCallersRepository')
  })

  it('return enabled callers', async () => {
    await repository.save(virtualCallerBuilder({isEnabled: true, id: 'enabled-caller'}).build())
    await repository.save(virtualCallerBuilder({isEnabled: false, id: 'disabled-caller'}).build())

    const enabledCallers = await repository.enabledCallers()

    expect(enabledCallers).to.have.lengthOf(1)
    expect(enabledCallers[0].id).to.be.equal('enabled-caller')
  })
})
