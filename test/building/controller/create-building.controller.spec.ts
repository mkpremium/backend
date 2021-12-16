import { stub } from 'sinon'
import { expect } from 'chai'
import { RequestHandler } from '../../../src/infrastructure/request-handler'
import { createBuildingController } from '../../../src/building/controller/create-building.controller'

describe('createBuildingController', () => {
  let controller: RequestHandler
  let testReq
  let testRes

  beforeEach(() => {
    testReq = {}
    testRes = {
      sendStatus: stub(),
    }

    controller = createBuildingController({})
  })

  it('creates SUT', () => {
    expect(controller).to.be.ok
  })

  it('is not implemented', async () => {
    await controller(testReq, testRes)

    expect(testRes.sendStatus).to.have.been.calledWith(501)
  })
})
