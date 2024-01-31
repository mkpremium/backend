import { expect } from 'chai'
import { RequestHandler } from '../../../src/infrastructure/request-handler'
import { createBuildingController } from '../../../src/building/controller/create-building.controller'

describe('createBuildingController', () => {
  let controller: RequestHandler
  let buildingsRepositoryStub

  beforeEach(() => {
    controller = createBuildingController({
      buildingsRepository: buildingsRepositoryStub
    })
  })

  it('creates SUT', () => {
    expect(controller).to.be.ok
  })
})
