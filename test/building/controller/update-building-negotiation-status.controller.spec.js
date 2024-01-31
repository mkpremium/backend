import { expect } from 'chai'
import { createUpdateBuildingNegotiationStatusController } from '../../../src/building/controller/update-building-negotiation-status.controller'
import { spy, stub } from 'sinon'

describe('Update Building Negotiation Status Controller', function () {
  let controller
  let updateBuildingNegotiationStatusServiceSpy

  beforeEach(function () {
    updateBuildingNegotiationStatusServiceSpy = {
      updateBuildingStatus: stub()
    }
    controller = createUpdateBuildingNegotiationStatusController({
      updateBuildingNegotiationStatusService: updateBuildingNegotiationStatusServiceSpy
    })
  })

  it('update building negotiation status using service', function () {
    const testBuildingId = 'test-building-id'
    const testRequest = {
      params: {
        buildingId: testBuildingId
      },
      user: {
        id: 'test-user-id'
      },
      body: {
        status: 'COMPRADO',
        sourceOwnerId: 'test-source-owner-id'
      }
    }
    const testResponse = {
      status: stub().returnsThis(),
      json: spy()
    }

    updateBuildingNegotiationStatusServiceSpy.updateBuildingStatus.resolves()
    return controller(testRequest, testResponse).then(() => {
      expect(updateBuildingNegotiationStatusServiceSpy.updateBuildingStatus)
        .to.have.been.calledWith(testBuildingId, {
          userId: 'test-user-id',
          sourceOwnerId: 'test-source-owner-id',
          status: 'COMPRADO'
        })
      expect(testResponse.status).to.have.been.calledWith(200)
      expect(testResponse.json).to.have.been.called
    })
  })
})
