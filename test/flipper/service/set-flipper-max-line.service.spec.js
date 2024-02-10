import { expect } from 'chai'
import { stub } from 'sinon'
import { SetFlipperMaxLineService } from '../../../src/flipper/service/set-flipper-max-line.service'

describe.skip('SetFlipperMaxLineService', function () {
  const testMaxLine = 1000000
  const testFlipperId = 'test-flipper-id'

  let service
  let usersRepositoryStub

  beforeEach(function () {
    usersRepositoryStub = {
      get: stub(),
      save: stub()
    }
    service = new SetFlipperMaxLineService({ usersRepository: usersRepositoryStub })
  })

  it('save flipper with setup max line', async function () {
    const testFlipper = null
    usersRepositoryStub.get.withArgs(testFlipperId).resolves(testFlipper)
    usersRepositoryStub.save.resolves()

    await service.setFlipperMaxLine(testFlipperId, testMaxLine)

    expect(usersRepositoryStub.save).to.have.been.calledWithMatch(u => u.maxLine === testMaxLine)
  })
})
