import * as TE from 'fp-ts/TaskEither'
import { stub } from 'sinon'
import { expect } from 'chai'
import { RequestHandler } from '../../../src/infrastructure/request-handler'
import { listLeadsController } from '../../../src/flipper/controller/list-leads.controller'
import { createLoggerMock } from '../../infrastructure/logger.spec'

describe('listLeadsController', () => {
  let controller: RequestHandler
  let flipperLeadsServiceStub
  let testReq
  let testRes

  beforeEach(() => {
    testReq = {
      params: {
        flipperId: 'test-flipper-id'
      }
    }
    testRes = {
      sendStatus: stub(),
      json: stub(),
    }
    flipperLeadsServiceStub = {
      leadsFor: stub(),
    }

    controller = listLeadsController({
      flipperLeadsService: flipperLeadsServiceStub,
      logger: createLoggerMock(),
    })
  })

  it('creates SUT', () => {
    expect(controller).to.be.ok
  })

  it(`return flipper's leads`, async () => {
    const testFlipperLeads = [ { id: 'lead-1' } ]
    flipperLeadsServiceStub.leadsFor.withArgs({ flipperId: testReq.params.flipperId }).returns(TE.of(testFlipperLeads))

    await controller(testReq, testRes)

    expect(testRes.json).to.have.been.calledWith(testFlipperLeads)
  })
})
