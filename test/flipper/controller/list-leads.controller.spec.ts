import { stub } from 'sinon'
import { expect } from 'chai'
import { RequestHandler } from '../../../src/infrastructure/request-handler'
import { listLeadsController } from '../../../src/flipper/controller/list-leads.controller'

describe('listLeadsController', () => {
  let controller: RequestHandler
  let testReq
  let testRes

  beforeEach(() => {
    testReq = {}
    testRes = {
      sendStatus: stub(),
    }

    controller = listLeadsController({})
  })

  it('creates SUT', () => {
    expect(controller).to.be.ok
  })

  it('is not implemented', async () => {
    await controller(testReq, testRes)

    expect(testRes.sendStatus).to.have.been.calledWith(501)
  })
})
