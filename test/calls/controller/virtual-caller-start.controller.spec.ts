import { expect } from 'chai'
import { RequestHandler } from 'express'
import { stub } from 'sinon'
import { createStartVirtualCallerController } from '../../../src/calls/controller/virtual-caller-start.controller'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe('virtual-caller-start.controller', () => {
  let controller: RequestHandler
  let virtualCallerSupervisorStub
  let virtualCallersRepositoryStub

  beforeEach(() => {
    virtualCallerSupervisorStub = {
      check: stub(),
    }
    virtualCallersRepositoryStub = {
      enabledCallers: stub(),
    }

    controller = createStartVirtualCallerController({
      virtualCallerConfig: undefined, virtualCallerPhoneNumber: '',
      virtualCallerSupervisor: virtualCallerSupervisorStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
    })
  })

  it('check with supervisor for every enabled caller', async () => {
    virtualCallersRepositoryStub.enabledCallers.resolves([
      virtualCallerBuilder({ id: 'caller-1' }).build(),
      virtualCallerBuilder({ id: 'caller-2' }).build(),
    ])

    await controller(undefined, { json: stub() } as any, undefined)

    expect(virtualCallerSupervisorStub.check).to.have.been.calledTwice
    expect(virtualCallerSupervisorStub.check).to.have.been.calledWithMatch(({caller}) => caller.id === 'caller-1')
    expect(virtualCallerSupervisorStub.check).to.have.been.calledWithMatch(({caller}) => caller.id === 'caller-2')
  })
})
