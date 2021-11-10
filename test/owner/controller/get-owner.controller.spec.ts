import { stub } from 'sinon'
import { expect } from 'chai'
import { RequestHandler } from '../../../src/infrastructure/request-handler'
import { getOwnerController } from '../../../src/owner/controller/get-owner.controller'
import { ownerBuilder } from '../owner.builder'

describe('getOwnerController', () => {
  let controller: RequestHandler
  let ownerRepositoryStub
  let testReq
  let testRes

  beforeEach(() => {
    testReq = {
      params: {
        ownerId: 'test-owner-id'
      }
    }
    testRes = {
      json: stub(),
    }
    ownerRepositoryStub = {
      get: stub(),
    }

    controller = getOwnerController({
      ownersRepository: ownerRepositoryStub,
    })
  })

  it('creates SUT', () => {
    expect(controller).to.be.ok
  })

  it('returns owner of given id', async () => {
    const testOwner = ownerBuilder().build()
    ownerRepositoryStub.get.withArgs(testReq.params.ownerId).resolves(testOwner)

    await controller(testReq, testRes)

    expect(testRes.json).to.have.been.calledWith(testOwner)
  })
})
