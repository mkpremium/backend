import { stub } from 'sinon'
import { expect } from 'chai'
import { RequestHandler } from '../../infrastructure/request-handler'
import { getOwnerController } from './get-owner.controller'

describe('getOwnerController', () => {
  let controller: RequestHandler
  let testReq
  let testRes

  beforeEach(() => {
    testReq = {}
    testRes = {
      sendStatus: stub(),
    }

    controller = getOwnerController({})
  })

  it('creates SUT', () => {
    expect(controller).to.be.ok
  })

  it('is not implemented', async () => {
    await controller(testReq, testRes)

    expect(testRes.sendStatus).to.have.been.calledWith(501)
  })
})
