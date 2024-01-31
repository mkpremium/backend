import { SetFlipperMaxLineService } from '../../../src/flipper/service/set-flipper-max-line.service'
import { expect } from 'chai'
import { stub } from 'sinon'
import { buildUser } from '../../common'
import fromJSON from 'tcomb/lib/fromJSON'
import { User } from '../../../src/types/user'

describe('SetFlipperMaxLineService', function () {
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
    const testFlipper = fromJSON(buildUser({ id: testFlipperId, roles: ['BUSINESS'] }), User)
    usersRepositoryStub.get.withArgs(testFlipperId).resolves(testFlipper)
    usersRepositoryStub.save.resolves()

    await service.setFlipperMaxLine(testFlipperId, testMaxLine)

    expect(usersRepositoryStub.save).to.have.been.calledWithMatch(u => u.maxLine === testMaxLine)
  })
})
